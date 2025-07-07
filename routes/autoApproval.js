const express = require('express');
const router = express.Router();
const autoApprovalService = require('../autoApprovalService');

// Middleware to ensure admin access
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'Admin access required' });
}

// Process single expert auto-approval
router.post('/expert/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await autoApprovalService.processExpertApproval(id);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error processing expert auto-approval:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process expert auto-approval' 
        });
    }
});

// Process single skill auto-approval
router.post('/skill/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await autoApprovalService.processSkillApproval(id);
        
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Error processing skill auto-approval:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process skill auto-approval' 
        });
    }
});

// Process all pending experts
router.post('/experts/bulk', isAdmin, async (req, res) => {
    try {
        console.log(' Bulk expert auto-approval requested');
        console.log(' Admin user:', req.session.user);
        
        const results = await autoApprovalService.processAllPendingExperts();
        console.log(' Processing results:', results);
        
        const summary = {
            total: results.length,
            autoApproved: results.filter(r => r.decision === 'approve').length,
            autoRejected: results.filter(r => r.decision === 'reject').length,
            manualReview: results.filter(r => r.decision === 'manual').length,
            results
        };
        
        console.log(' Summary:', summary);
        
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Error processing bulk expert auto-approval:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process bulk expert auto-approval',
            details: error.message
        });
    }
});

// Process all pending skills
router.post('/skills/bulk', isAdmin, async (req, res) => {
    try {
        const results = await autoApprovalService.processAllPendingSkills();
        
        const summary = {
            total: results.length,
            autoApproved: results.filter(r => r.decision === 'approve').length,
            autoRejected: results.filter(r => r.decision === 'reject').length,
            manualReview: results.filter(r => r.decision === 'manual').length,
            results
        };
        
        res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('Error processing bulk skill auto-approval:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to process bulk skill auto-approval' 
        });
    }
});

// Get auto-approval statistics
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const stats = await autoApprovalService.getAutoApprovalStats();
        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Error getting auto-approval stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get auto-approval statistics' 
        });
    }
});

// Get scoring details for an expert (for admin review)
router.get('/expert/:id/score', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        console.log(` Calculating score for expert ID: ${id}`);
        
        const score = await autoApprovalService.calculateExpertScore(id);
        console.log(` Expert ${id} score: ${score}`);
        
        res.json({
            success: true,
            score,
            thresholds: autoApprovalService.config.expert
        });
    } catch (error) {
        console.error('Error getting expert score:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get expert score',
            details: error.message
        });
    }
});

// Get scoring details for a skill (for admin review)
router.get('/skill/:id/score', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const score = await autoApprovalService.calculateSkillScore(id);
        
        res.json({
            success: true,
            score,
            thresholds: autoApprovalService.config.skill
        });
    } catch (error) {
        console.error('Error getting skill score:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get skill score' 
        });
    }
});

module.exports = router; 