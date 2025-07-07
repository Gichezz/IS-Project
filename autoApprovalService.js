const db = require('./database');
const Activity = require('./routes/activity');

class AutoApprovalService {
    constructor() {
        // Configuration for auto-approval thresholds
        this.config = {
            expert: {
                autoApproveThreshold: 75, // Score out of 100
                autoRejectThreshold: 30,  // Score out of 100
                weights: {
                    emailVerification: 15,
                    descriptionQuality: 20,
                    fileUploads: 25,
                    skillRelevance: 20,
                    hourlyRate: 10,
                    accountAge: 10
                }
            },
            skill: {
                autoApproveThreshold: 80, // Score out of 100
                autoRejectThreshold: 35,  // Score out of 100
                weights: {
                    descriptionQuality: 25,
                    proofFiles: 30,
                    hourlyRate: 15,
                    expertHistory: 20,
                    skillDemand: 10
                }
            }
        };
    }

    /**
     * Automatically approve/reject experts based on scoring algorithm
     */
    async processExpertApproval(expertId) {
        try {
            console.log(` Auto-processing expert approval for ID: ${expertId}`);
            
            const score = await this.calculateExpertScore(expertId);
            const decision = this.makeDecision(score, this.config.expert);
            
            if (decision !== 'manual') {
                await this.applyExpertDecision(expertId, decision, score);
                return { decision, score, processed: true };
            }
            
            return { decision: 'manual', score, processed: false };
        } catch (error) {
            console.error('Error in expert auto-approval:', error);
            return { decision: 'manual', score: 0, processed: false, error: error.message };
        }
    }

    /**
     * Automatically approve/reject skills based on scoring algorithm
     */
    async processSkillApproval(skillId) {
        try {
            console.log(` Auto-processing skill approval for ID: ${skillId}`);
            
            const score = await this.calculateSkillScore(skillId);
            const decision = this.makeDecision(score, this.config.skill);
            
            if (decision !== 'manual') {
                await this.applySkillDecision(skillId, decision, score);
                return { decision, score, processed: true };
            }
            
            return { decision: 'manual', score, processed: false };
        } catch (error) {
            console.error('Error in skill auto-approval:', error);
            return { decision: 'manual', score: 0, processed: false, error: error.message };
        }
    }

    /**
     * Calculate expert approval score based on multiple criteria
     */
    async calculateExpertScore(expertId) {
        const weights = this.config.expert.weights;
        let totalScore = 0;
        const breakdown = {};

        try {
            console.log(` Calculating score for expert: ${expertId}`);
            
            // Get expert data
            const [expertRows] = await db.execute(
                'SELECT * FROM users WHERE id = ? AND role = "expert"',
                [expertId]
            );

            if (expertRows.length === 0) {
                throw new Error('Expert not found');
            }

            const expert = expertRows[0];
            console.log(' Expert data:', {
                name: expert.name,
                email: expert.email,
                email_verified: expert.email_verified,
                description_length: expert.description?.length || 0,
                files: expert.files,
                skills: expert.skills,
                hourly_rate: expert.hourly_rate,
                created_at: expert.created_at
            });

            // 1. Email verification (15 points)
            if (expert.email_verified) {
                totalScore += weights.emailVerification;
                breakdown.emailVerification = weights.emailVerification;
                console.log(`Email verified: +${weights.emailVerification} points`);
            } else {
                breakdown.emailVerification = 0;
                console.log(` Email not verified: +0 points`);
            }

            // 2. Description quality (20 points)
            const descriptionScore = this.assessDescriptionQuality(expert.description);
            const descriptionPoints = descriptionScore * weights.descriptionQuality / 100;
            totalScore += descriptionPoints;
            breakdown.descriptionQuality = Math.round(descriptionPoints);
            console.log(` Description quality: ${descriptionScore}/100 = +${Math.round(descriptionPoints)} points`);

            // 3. File uploads (25 points)
            const fileScore = this.assessFileUploads(expert.files);
            const filePoints = fileScore * weights.fileUploads / 100;
            totalScore += filePoints;
            breakdown.fileUploads = Math.round(filePoints);
            console.log(` File uploads: ${fileScore}/100 = +${Math.round(filePoints)} points`);

            // 4. Skill relevance (20 points)
            const skillScore = await this.assessSkillRelevance(expert.skills);
            const skillPoints = skillScore * weights.skillRelevance / 100;
            totalScore += skillPoints;
            breakdown.skillRelevance = Math.round(skillPoints);
            console.log(` Skill relevance: ${skillScore}/100 = +${Math.round(skillPoints)} points`);

            // 5. Hourly rate (10 points)
            const rateScore = this.assessHourlyRate(expert.hourly_rate);
            const ratePoints = rateScore * weights.hourlyRate / 100;
            totalScore += ratePoints;
            breakdown.hourlyRate = Math.round(ratePoints);
            console.log(` Hourly rate: ${rateScore}/100 = +${Math.round(ratePoints)} points`);

            // 6. Account age (10 points)
            const ageScore = this.assessAccountAge(expert.created_at);
            const agePoints = ageScore * weights.accountAge / 100;
            totalScore += agePoints;
            breakdown.accountAge = Math.round(agePoints);
            console.log(` Account age: ${ageScore}/100 = +${Math.round(agePoints)} points`);

            const finalScore = Math.round(totalScore);
            console.log(` Final score: ${finalScore}/100`);
            console.log(` Score breakdown:`, breakdown);

            return finalScore;

        } catch (error) {
            console.error('Error calculating expert score:', error);
            return 0;
        }
    }

    /**
     * Calculate skill approval score based on multiple criteria
     */
    async calculateSkillScore(skillId) {
        const weights = this.config.skill.weights;
        let totalScore = 0;

        try {
            // Get skill data
            const [skillRows] = await db.execute(
                'SELECT s.*, u.name as expert_name, u.created_at as expert_created_at FROM skills s JOIN users u ON s.expert_id = u.id WHERE s.id = ?',
                [skillId]
            );

            if (skillRows.length === 0) {
                throw new Error('Skill not found');
            }

            const skill = skillRows[0];

            // 1. Description quality (25 points)
            const descriptionScore = this.assessDescriptionQuality(skill.description);
            totalScore += descriptionScore * weights.descriptionQuality / 100;

            // 2. Proof files (30 points)
            const fileScore = this.assessProofFiles(skill.proof_files);
            totalScore += fileScore * weights.proofFiles / 100;

            // 3. Hourly rate (15 points)
            const rateScore = this.assessSkillHourlyRate(skill.hourly_rate);
            totalScore += rateScore * weights.hourlyRate / 100;

            // 4. Expert history (20 points)
            const historyScore = await this.assessExpertHistory(skill.expert_id);
            totalScore += historyScore * weights.expertHistory / 100;

            // 5. Skill demand (10 points)
            const demandScore = await this.assessSkillDemand(skill.skill_name);
            totalScore += demandScore * weights.skillDemand / 100;

            return Math.round(totalScore);

        } catch (error) {
            console.error('Error calculating skill score:', error);
            return 0;
        }
    }

    /**
     * Assess description quality (0-100)
     */
    assessDescriptionQuality(description) {
        if (!description || description.trim().length === 0) {
            return 0;
        }

        const text = description.trim();
        let score = 0;

        // Length scoring (0-40 points)
        if (text.length >= 200) score += 40;
        else if (text.length >= 100) score += 30;
        else if (text.length >= 50) score += 20;
        else if (text.length >= 20) score += 10;

        // Content quality indicators (0-60 points)
        const qualityIndicators = [
            'experience', 'certified', 'professional', 'expertise', 'specialized',
            'training', 'education', 'degree', 'certificate', 'portfolio',
            'projects', 'clients', 'industry', 'years', 'successful'
        ];

        const foundIndicators = qualityIndicators.filter(indicator => 
            text.toLowerCase().includes(indicator)
        );

        score += Math.min(60, foundIndicators.length * 10);

        return Math.min(100, score);
    }

    /**
     * Assess file uploads quality (0-100)
     */
    assessFileUploads(files) {
        if (!files || files.trim().length === 0) {
            return 0;
        }

        const fileList = files.split(',').filter(f => f.trim());
        let score = 0;

        // Number of files (0-40 points)
        if (fileList.length >= 3) score += 40;
        else if (fileList.length >= 2) score += 30;
        else if (fileList.length >= 1) score += 20;

        // File type diversity (0-30 points)
        const fileTypes = new Set();
        fileList.forEach(file => {
            const extension = file.split('.').pop()?.toLowerCase();
            if (extension) fileTypes.add(extension);
        });

        if (fileTypes.size >= 3) score += 30;
        else if (fileTypes.size >= 2) score += 20;
        else if (fileTypes.size >= 1) score += 10;

        // File naming quality (0-30 points)
        const hasGoodNaming = fileList.some(file => {
            const name = file.toLowerCase();
            return name.includes('certificate') || name.includes('portfolio') || 
                   name.includes('resume') || name.includes('cv') || 
                   name.includes('project') || name.includes('work');
        });

        if (hasGoodNaming) score += 30;

        return Math.min(100, score);
    }

    /**
     * Assess proof files for skills (0-100)
     */
    assessProofFiles(proofFiles) {
        if (!proofFiles || proofFiles.trim().length === 0) {
            return 0;
        }

        const fileList = proofFiles.split(',').filter(f => f.trim());
        let score = 0;

        // Number of proof files (0-50 points)
        if (fileList.length >= 3) score += 50;
        else if (fileList.length >= 2) score += 35;
        else if (fileList.length >= 1) score += 25;

        // File type assessment (0-50 points)
        const hasPdf = fileList.some(f => f.toLowerCase().includes('.pdf'));
        const hasImage = fileList.some(f => f.toLowerCase().includes('.jpg') || f.toLowerCase().includes('.png'));
        const hasDocument = fileList.some(f => f.toLowerCase().includes('.doc') || f.toLowerCase().includes('.docx'));

        if (hasPdf) score += 20;
        if (hasImage) score += 15;
        if (hasDocument) score += 15;

        return Math.min(100, score);
    }

    /**
     * Assess skill relevance (0-100)
     */
    async assessSkillRelevance(skills) {
        if (!skills) return 0;

        try {
            // Get popular skills from the platform
            const [popularSkills] = await db.execute(`
                SELECT skill_name, COUNT(*) as count 
                FROM skills 
                WHERE status = 'Approved' 
                GROUP BY skill_name 
                ORDER BY count DESC 
                LIMIT 20
            `);

            const popularSkillNames = popularSkills.map(s => s.skill_name.toLowerCase());
            const userSkills = skills.split(',').map(s => s.trim().toLowerCase());

            let relevantSkills = 0;
            userSkills.forEach(skill => {
                if (popularSkillNames.some(popular => popular.includes(skill) || skill.includes(popular))) {
                    relevantSkills++;
                }
            });

            return Math.min(100, (relevantSkills / userSkills.length) * 100);
        } catch (error) {
            console.error('Error assessing skill relevance:', error);
            return 50; // Default score
        }
    }

    /**
     * Assess hourly rate reasonableness (0-100)
     */
    assessHourlyRate(hourlyRate) {
        if (!hourlyRate || hourlyRate <= 0) return 0;

        // Reasonable range: 500-5000 KES per hour
        if (hourlyRate >= 500 && hourlyRate <= 5000) {
            return 100;
        } else if (hourlyRate >= 300 && hourlyRate <= 7000) {
            return 70;
        } else if (hourlyRate >= 200 && hourlyRate <= 10000) {
            return 40;
        } else {
            return 10;
        }
    }

    /**
     * Assess skill hourly rate (0-100)
     */
    assessSkillHourlyRate(hourlyRate) {
        if (!hourlyRate || hourlyRate <= 0) return 0;

        // Reasonable range: 300-8000 KES per hour
        if (hourlyRate >= 300 && hourlyRate <= 8000) {
            return 100;
        } else if (hourlyRate >= 200 && hourlyRate <= 12000) {
            return 70;
        } else if (hourlyRate >= 100 && hourlyRate <= 15000) {
            return 40;
        } else {
            return 10;
        }
    }

    /**
     * Assess account age (0-100)
     */
    assessAccountAge(createdAt) {
        if (!createdAt) return 0;

        const accountAge = Date.now() - new Date(createdAt).getTime();
        const daysOld = accountAge / (1000 * 60 * 60 * 24);

        if (daysOld >= 30) return 100;
        else if (daysOld >= 14) return 80;
        else if (daysOld >= 7) return 60;
        else if (daysOld >= 3) return 40;
        else if (daysOld >= 1) return 20;
        else return 10;
    }

    /**
     * Assess expert history (0-100)
     */
    async assessExpertHistory(expertId) {
        try {
            // Check if expert has other approved skills
            const [approvedSkills] = await db.execute(
                'SELECT COUNT(*) as count FROM skills WHERE expert_id = ? AND status = "Approved"',
                [expertId]
            );

            const approvedCount = approvedSkills[0].count;

            if (approvedCount >= 3) return 100;
            else if (approvedCount >= 2) return 80;
            else if (approvedCount >= 1) return 60;
            else return 30;

        } catch (error) {
            console.error('Error assessing expert history:', error);
            return 30;
        }
    }

    /**
     * Assess skill demand (0-100)
     */
    async assessSkillDemand(skillName) {
        try {
            // Check how many experts offer this skill
            const [skillCount] = await db.execute(
                'SELECT COUNT(*) as count FROM skills WHERE skill_name = ? AND status = "Approved"',
                [skillName]
            );

            const count = skillCount[0].count;

            // Lower count = higher demand (less competition)
            if (count === 0) return 100;
            else if (count <= 2) return 90;
            else if (count <= 5) return 70;
            else if (count <= 10) return 50;
            else if (count <= 20) return 30;
            else return 10;

        } catch (error) {
            console.error('Error assessing skill demand:', error);
            return 50;
        }
    }

    /**
     * Make decision based on score and thresholds
     */
    makeDecision(score, config) {
        if (score >= config.autoApproveThreshold) {
            return 'approve';
        } else if (score <= config.autoRejectThreshold) {
            return 'reject';
        } else {
            return 'manual';
        }
    }

    /**
     * Apply expert approval decision
     */
    async applyExpertDecision(expertId, decision, score) {
        try {
            const approved = decision === 'approve' ? 1 : -1;
            
            await db.execute(
                'UPDATE users SET approved = ? WHERE id = ?',
                [approved, expertId]
            );

            // Get expert info for activity log
            const [expertRows] = await db.execute(
                'SELECT name, email FROM users WHERE id = ?',
                [expertId]
            );

            if (expertRows.length > 0) {
                const expert = expertRows[0];
                const activityType = decision === 'approve' ? 'Auto Expert Approved' : 'Auto Expert Rejected';
                const description = `${expert.name} (${expert.email}) was ${decision === 'approve' ? 'auto-approved' : 'auto-rejected'} with score ${score}`;

                await Activity.create({
                    userId: expertId,
                    type: activityType,
                    description
                });

                // Send notification
                await this.sendNotification(expertId, decision, 'expert', score);
            }

            console.log(` Expert ${expertId} ${decision === 'approve' ? 'auto-approved' : 'auto-rejected'} with score ${score}`);
        } catch (error) {
            console.error('Error applying expert decision:', error);
            throw error;
        }
    }

    /**
     * Apply skill approval decision
     */
    async applySkillDecision(skillId, decision, score) {
        try {
            const status = decision === 'approve' ? 'Approved' : 'Rejected';
            
            await db.execute(
                'UPDATE skills SET status = ? WHERE id = ?',
                [status, skillId]
            );

            // Get skill info for activity log
            const [skillRows] = await db.execute(
                'SELECT skill_name, expert_id FROM skills WHERE id = ?',
                [skillId]
            );

            if (skillRows.length > 0) {
                const skill = skillRows[0];
                const activityType = decision === 'approve' ? 'Auto Skill Approved' : 'Auto Skill Rejected';
                const description = `"${skill.skill_name}" was ${decision === 'approve' ? 'auto-approved' : 'auto-rejected'} with score ${score}`;

                await Activity.create({
                    userId: skill.expert_id,
                    type: activityType,
                    description
                });

                // Send notification
                await this.sendNotification(skill.expert_id, decision, 'skill', score, skill.skill_name);
            }

            console.log(`Skill ${skillId} ${decision === 'approve' ? 'auto-approved' : 'auto-rejected'} with score ${score}`);
        } catch (error) {
            console.error('Error applying skill decision:', error);
            throw error;
        }
    }

    /**
     * Send notification to user about auto-approval decision
     */
    async sendNotification(userId, decision, type, score, skillName = '') {
        try {
            const message = type === 'expert' 
                ? `Your expert account was ${decision === 'approve' ? 'automatically approved' : 'automatically rejected'} with a score of ${score}/100. ${decision === 'reject' ? 'You can contact support for more information.' : 'Welcome to SkillSwap!'}`
                : `Your skill "${skillName}" was ${decision === 'approve' ? 'automatically approved' : 'automatically rejected'} with a score of ${score}/100. ${decision === 'reject' ? 'You can contact support for more information.' : 'Your skill is now available for students!'}`;

            await db.execute(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [userId, message]
            );
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    /**
     * Process all pending experts automatically
     */
    async processAllPendingExperts() {
        try {
            console.log(' Fetching pending experts...');
            // Only get experts that haven't been processed yet (approved = 0 and no auto-approval activity)
            const [pendingExperts] = await db.execute(`
                SELECT u.id 
                FROM users u 
                LEFT JOIN activities a ON u.id = a.user_id 
                    AND a.type IN ('Auto Expert Approved', 'Auto Expert Rejected')
                WHERE u.role = "expert" 
                    AND u.approved = 0 
                    AND a.id IS NULL
            `);

            console.log(` Found ${pendingExperts.length} unprocessed pending experts`);

            const results = [];
            for (const expert of pendingExperts) {
                console.log(` Processing expert ID: ${expert.id}`);
                const result = await this.processExpertApproval(expert.id);
                results.push({ expertId: expert.id, ...result });
                console.log(` Expert ${expert.id} result:`, result);
            }

            console.log(' All experts processed:', results);
            return results;
        } catch (error) {
            console.error('Error processing all pending experts:', error);
            throw error;
        }
    }

    /**
     * Process all pending skills automatically
     */
    async processAllPendingSkills() {
        try {
            const [pendingSkills] = await db.execute(
                'SELECT id FROM skills WHERE status = "Pending"'
            );

            const results = [];
            for (const skill of pendingSkills) {
                const result = await this.processSkillApproval(skill.id);
                results.push({ skillId: skill.id, ...result });
            }

            return results;
        } catch (error) {
            console.error('Error processing all pending skills:', error);
            throw error;
        }
    }

    /**
     * Get auto-approval statistics
     */
    async getAutoApprovalStats() {
        try {
            const [expertStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN type = 'Auto Expert Approved' THEN 1 ELSE 0 END) as auto_approved,
                    SUM(CASE WHEN type = 'Auto Expert Rejected' THEN 1 ELSE 0 END) as auto_rejected
                FROM activities 
                WHERE type IN ('Auto Expert Approved', 'Auto Expert Rejected')
            `);

            const [skillStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN type = 'Auto Skill Approved' THEN 1 ELSE 0 END) as auto_approved,
                    SUM(CASE WHEN type = 'Auto Skill Rejected' THEN 1 ELSE 0 END) as auto_rejected
                FROM activities 
                WHERE type IN ('Auto Skill Approved', 'Auto Skill Rejected')
            `);

            return {
                experts: expertStats[0],
                skills: skillStats[0]
            };
        } catch (error) {
            console.error('Error getting auto-approval stats:', error);
            return { experts: {}, skills: {} };
        }
    }
}

module.exports = new AutoApprovalService(); 