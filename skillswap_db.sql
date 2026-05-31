-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 05, 2025 at 07:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillswap_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`id`, `user_id`, `type`, `description`, `timestamp`) VALUES
(118, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'New Registration', 'Zarian Achieng (zarian.ochieng@strathmore.edu) registered as expert', '2025-07-07 07:59:05'),
(119, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Blocked Login', 'Zarian Achieng (zarian.ochieng@strathmore.edu) attempted login before approval', '2025-07-07 08:01:40'),
(122, 'b2a89109-5bd7-11f0-84e9-7c4d8f3425e6', 'New Registration', 'Brian Njehia Nyoike. (brian.njehia@strathmore.edu) registered as student', '2025-07-08 08:44:02'),
(123, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'New Registration', 'Muhammad Abdalla (muhammad.abdalla@strathmore.edu) registered as expert', '2025-07-08 08:48:55'),
(124, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Muhammad Abdalla (muhammad.abdalla@strathmore.edu) attempted login before approval', '2025-07-08 08:53:51'),
(125, '74db2c13-5bd9-11f0-84e9-7c4d8f3425e6', 'New Registration', 'elvis wafuke (elviswafuke@strathmore.edu) registered as expert', '2025-07-08 08:56:37'),
(126, '5384f1b6-5bda-11f0-84e9-7c4d8f3425e6', 'New Registration', 'Isaac (isaac.irungu@strathmore.edu) registered as expert', '2025-07-08 09:02:51'),
(128, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'New Registration', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) registered as expert', '2025-07-08 09:26:47'),
(129, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) attempted login before approval', '2025-07-08 09:27:16'),
(130, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) attempted login before approval', '2025-07-08 09:27:18'),
(131, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) attempted login before approval', '2025-07-08 09:28:20'),
(132, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) attempted login before approval', '2025-07-08 09:28:21'),
(133, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'New Registration', 'James Mumo (james.mumo@strathmore.edu) registered as expert', '2025-07-08 09:31:43'),
(134, '74db2c13-5bd9-11f0-84e9-7c4d8f3425e6', 'Auto Expert Rejected', 'elvis wafuke (elviswafuke@strathmore.edu) was auto-rejected with score 25', '2025-07-08 09:40:40'),
(135, 'abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'Billiart Mwangi (billiart.mwangi@strathmore.edu) attempted login before approval', '2025-07-08 09:52:34'),
(136, '74db2c13-5bd9-11f0-84e9-7c4d8f3425e6', 'Blocked Login', 'elvis wafuke (elviswafuke@strathmore.edu) attempted login before approval', '2025-07-08 09:58:20'),
(137, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Skill Approved', '\"painting\" was approved', '2025-07-08 10:02:35'),
(138, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Skill Approved', '\"crocheting\" was approved', '2025-07-08 10:02:44'),
(139, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"robotics\" was approved', '2025-07-08 10:02:50'),
(140, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"web-dev\" was approved', '2025-07-08 10:02:54'),
(141, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"music\" was approved', '2025-07-08 10:02:59'),
(142, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"painting\" was approved', '2025-07-08 10:03:04'),
(143, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"Ai\" was approved', '2025-07-08 10:09:09'),
(144, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Skill Rejected', '\"painting\" was rejected', '2025-07-08 10:09:50'),
(145, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Skill Approved', '\"drawing\" was approved', '2025-07-08 10:16:15'),
(146, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Skill Approved', '\"baking\" was approved', '2025-07-08 10:16:36'),
(147, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Skill Approved', '\"robotics\" was approved', '2025-07-08 13:44:35'),
(153, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Skill Approved', '\"robotics\" was approved', '2025-07-09 09:34:00');

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id` varchar(36) NOT NULL,
  `user1_id` varchar(36) NOT NULL,
  `user2_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `conversations`
--

INSERT INTO `conversations` (`id`, `user1_id`, `user2_id`, `created_at`) VALUES
('29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', '2025-07-08 13:32:40');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `content`, `is_read`, `created_at`) VALUES
('1f6f1538-7ef3-402e-aa5f-9c1dd277da40', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'hi can we reschedule', 1, '2025-07-09 06:21:18'),
('2bdce519-253a-4313-bcc1-d1cd1245b7f4', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', '162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 11:00 AM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/77008159232?pwd=vupJJi1DyNbPk1MHTpXkLzCaV4Mo5E.1\r\n\r\nMeeting ID: 770 0815 9232\r\nPasscode: bU7z2Z', 1, '2025-07-09 07:06:40'),
('45a3324b-2c13-48c2-8161-9ee8b2a07314', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', '162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 01:00 PM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/75262642429?pwd=WVE7kX0XIuM4v1gGArdwVGIHBCw8mt.1\r\n\r\nMeeting ID: 752 6264 2429\r\nPasscode: 54jVyT', 0, '2025-07-09 09:30:50'),
('695568a8-3835-44b3-8ae4-90462c92ac66', '29e31ee6-8568-4136-874b-400311b35b40', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'yes', 1, '2025-07-09 06:02:16'),
('751b21b5-72d2-40a7-b948-cc207ed2d067', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'hi', 1, '2025-07-09 07:10:55'),
('959fb9b4-08f0-4cdb-9a0c-f092e1119498', '29e31ee6-8568-4136-874b-400311b35b40', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'yes', 1, '2025-07-09 06:21:49'),
('98dfa04a-8f58-4ff0-939e-8f17a1fe4f7f', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'hi', 1, '2025-07-09 06:01:22'),
('b0552a90-7d1c-41ad-8fb9-2f01079626ba', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'hey', 1, '2025-07-08 13:32:40'),
('b3dbd89b-07a8-4485-9929-19d95d6e55eb', '29e31ee6-8568-4136-874b-400311b35b40', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'hey, i\'m your student', 1, '2025-07-08 13:34:53'),
('b4ab9db1-22c0-44a5-92c8-2eb459260197', '29e31ee6-8568-4136-874b-400311b35b40', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'hi, i\'m your tutor', 0, '2025-07-09 09:32:08');

-- --------------------------------------------------------

--
-- Table structure for table `mpesa_payments`
--

CREATE TABLE `mpesa_payments` (
  `id` int(11) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `mpesa_code` varchar(20) DEFAULT NULL,
  `transaction_date` datetime DEFAULT NULL,
  `service_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `message`, `is_read`, `created_at`) VALUES
(84, '74db2c13-5bd9-11f0-84e9-7c4d8f3425e6', 'Your expert account was automatically rejected with a score of 25/100. You can contact support for more information.', 0, '2025-07-08 09:40:40'),
(85, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Your skill \"painting\" was Approved. ', 0, '2025-07-08 10:02:35'),
(86, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Your skill \"crocheting\" was Approved. ', 0, '2025-07-08 10:02:44'),
(87, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Your skill \"robotics\" was Approved. ', 0, '2025-07-08 10:02:50'),
(88, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Your skill \"web-dev\" was Approved. ', 0, '2025-07-08 10:02:54'),
(89, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Your skill \"music\" was Approved. ', 0, '2025-07-08 10:02:59'),
(90, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Your skill \"painting\" was Approved. ', 0, '2025-07-08 10:03:04'),
(91, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Your skill \"Ai\" was Approved. ', 0, '2025-07-08 10:09:09'),
(92, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Your skill \"painting\" was Rejected. misbehaviour', 0, '2025-07-08 10:09:50'),
(93, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'Your skill \"drawing\" was Approved. ', 0, '2025-07-08 10:16:15'),
(94, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Your skill \"baking\" was Approved. ', 0, '2025-07-08 10:16:36'),
(95, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Your skill \"robotics\" was Approved. ', 0, '2025-07-08 13:44:35'),
(96, '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'You have a new Zoom link for your session: <a href=\"162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 11:00 AM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/77008159232?pwd=vupJJi1DyNbPk1MHTpXkLzCaV4Mo5E.1\r\n\r\nMeeting ID: 770 0815 9232\r\nPasscode: bU7z2Z\" target=\"_blank\">162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 11:00 AM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/77008159232?pwd=vupJJi1DyNbPk1MHTpXkLzCaV4Mo5E.1\r\n\r\nMeeting ID: 770 0815 9232\r\nPasscode: bU7z2Z</a>', 0, '2025-07-09 07:06:40'),
(97, '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'You have a new Zoom link for your session: <a href=\"162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 01:00 PM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/75262642429?pwd=WVE7kX0XIuM4v1gGArdwVGIHBCw8mt.1\r\n\r\nMeeting ID: 752 6264 2429\r\nPasscode: 54jVyT\" target=\"_blank\">162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 01:00 PM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/75262642429?pwd=WVE7kX0XIuM4v1gGArdwVGIHBCw8mt.1\r\n\r\nMeeting ID: 752 6264 2429\r\nPasscode: 54jVyT</a>', 0, '2025-07-09 09:30:50'),
(98, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Your skill \"robotics\" was Approved. ', 0, '2025-07-09 09:34:00');

-- --------------------------------------------------------

--
-- Table structure for table `session_feedback`
--

CREATE TABLE `session_feedback` (
  `id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `rating` decimal(2,1) NOT NULL,
  `comments` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `session_feedback`
--

INSERT INTO `session_feedback` (`id`, `session_id`, `rating`, `comments`, `created_at`) VALUES
(3, 24, 3.0, 'i enjoyed it', '2025-07-08 13:35:59'),
(5, 30, 3.0, 'i learnt', '2025-07-09 09:35:03');

-- --------------------------------------------------------

--
-- Table structure for table `session_requests`
--

CREATE TABLE `session_requests` (
  `id` int(11) NOT NULL,
  `skill_requested` varchar(100) NOT NULL,
  `student_id` varchar(36) DEFAULT NULL,
  `student_email` varchar(100) NOT NULL,
  `expert_id` varchar(36) DEFAULT NULL,
  `requested_time` datetime NOT NULL,
  `status` enum('pending','accepted','completed','rejected') DEFAULT 'pending',
  `student_completed` tinyint(1) DEFAULT 0,
  `expert_completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `description` text DEFAULT NULL,
  `skill_id` int(11) DEFAULT NULL,
  `meeting_link` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `session_requests`
--

INSERT INTO `session_requests` (`id`, `skill_requested`, `student_id`, `student_email`, `expert_id`, `requested_time`, `status`, `student_completed`, `expert_completed`, `created_at`, `description`, `skill_id`, `meeting_link`) VALUES
(24, 'painting', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'sudheysi.ibrahim@strathmore.edu', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', '2025-08-05 10:00:00', 'accepted', 1, 0, '2025-07-08 13:25:33', 'i would like us to meet at this time', 6, NULL),
(30, 'crocheting', '5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'sudheysi.ibrahim@strathmore.edu', '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', '2025-09-05 11:01:00', 'accepted', 1, 0, '2025-07-09 09:29:24', 'interested', 10, '162484-Ryan Gicheru is inviting you to a scheduled Zoom meeting.\r\n\r\nTopic: My Meeting\r\nTime: Jul 9, 2025 01:00 PM Nairobi\r\nJoin Zoom Meeting\r\nhttps://us04web.zoom.us/j/75262642429?pwd=WVE7kX0XIuM4v1gGArdwVGIHBCw8mt.1\r\n\r\nMeeting ID: 752 6264 2429\r\nPasscode: 54jVyT'),
(31, 'drawing', 'b2a89109-5bd7-11f0-84e9-7c4d8f3425e6', 'brian.njehia@strathmore.edu', '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', '2025-08-08 05:05:00', 'pending', 1, 0, '2025-07-09 13:29:14', 'yes', 281, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `skills`
--

CREATE TABLE `skills` (
  `id` int(11) NOT NULL,
  `expert_id` varchar(36) DEFAULT NULL,
  `skill_name` varchar(100) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `proof_files` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected','Deleted') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skills`
--

INSERT INTO `skills` (`id`, `expert_id`, `skill_name`, `hourly_rate`, `description`, `proof_files`, `status`, `created_at`) VALUES
(5, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'robotics', 2000.00, 'robotics', '/uploads/proof-1752053563370-850073702.jpg', 'Approved', '2025-07-09 09:32:43'),
(6, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'painting', 2000.00, 'I have been painting for quite some time and i really enjoy it', '/uploads/proof-1751967902742-270262382.png', 'Approved', '2025-07-08 09:45:02'),
(10, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'crocheting', 1500.00, 'i really enjoy crocheting', '/uploads/proof-1751968134121-670044088.pdf', 'Approved', '2025-07-08 09:48:54'),
(88, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'web-dev', 3500.00, 'I am passionate about web development and i really like it', '/uploads/proof-1751968240924-725884121.jpg', 'Approved', '2025-07-08 09:50:40'),
(89, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'robotics', 4000.00, 'it\'s my happy place to design and imagine what robots can do', '/uploads/proof-1751968292182-71242690.png', 'Approved', '2025-07-08 09:51:32'),
(90, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'music', 1500.00, 'I like to sit and just create music as well as listen to albums that relate to my mood', '/uploads/proof-1751968486922-821296868.pdf', 'Approved', '2025-07-08 09:54:46'),
(279, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'painting', 1800.00, 'I\'m very passionate about painting where i can bring out my ideas', '/uploads/proof-1751968628228-504061133.png', 'Rejected', '2025-07-08 09:57:08'),
(280, '61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Ai', 4500.00, 'It\'s my go to hobby', '/uploads/proof-1751969199911-738604418.png', 'Approved', '2025-07-08 10:06:39'),
(281, '5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'drawing', 2300.00, 'I\'ve been drawing since my childhood and i\'m really good at it', '/uploads/proof-1751969638557-644401383.jpg', 'Approved', '2025-07-08 10:13:58'),
(282, '40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'baking', 2500.00, 'i\'m really passionate and i enjoy it alot', '/uploads/proof-1751969747575-298491875.png', 'Approved', '2025-07-08 10:15:47');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','expert','admin') NOT NULL,
  `skills` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `files` text DEFAULT NULL,
  `approved` tinyint(1) DEFAULT 0,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expires` datetime DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `verification_token` varchar(255) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `skills`, `description`, `files`, `approved`, `reset_token`, `reset_token_expires`, `email_verified`, `verification_token`, `hourly_rate`, `created_at`) VALUES
('40ee21b6-5b08-11f0-8ef2-7c4d8f3425e6', 'Zarian Achieng', 'zarian.ochieng@strathmore.edu', '$2b$10$YIEHeUE9AvNaSLOMmwHoyO3Uv89JpJ6YSm.Mmh3JTOQ0xGD.wRiiK', 'expert', '[\"Ai\",\"baking\"]', 'i\'m a baker and an AI', '1751875145320-wallhaven-breakingBad.jpg', 1, NULL, NULL, 1, NULL, 100.00, '2025-07-07 07:59:05'),
('5384f1b6-5bda-11f0-84e9-7c4d8f3425e6', 'Isaac', 'isaac.irungu@strathmore.edu', '$2b$10$o9tN5ik4pR9JOV0M.ZfVY.f9yIRO1Q/rmHxhqwrG99A5W.quqv6E6', 'expert', '[\"Ai\"]', 'cwencjer', '1751965370273-SU MaishaUni 2025 Coursework - The PDP (1).docx', 0, 'd92e2f94ea5a4b9c50ee07a980485ec1bab8fb44dfd899becabf0303a423d160', '2025-07-08 13:04:16', 1, NULL, 1000.00, '2025-07-08 09:02:51'),
('5466df1d-58de-11f0-9eba-7c4d8f3425e6', 'Sudheysi Ali Ibrahim', 'sudheysi.ibrahim@strathmore.edu', '$2b$10$QVX5FBBPhvx0ej/Ywh3KAu8/bqGQr57itG42oNhB5RfwqtfBQvPti', 'student', '[\"AI\"]', NULL, NULL, 1, NULL, NULL, 1, NULL, NULL, '2025-07-07 03:39:38'),
('5bd45f33-5bde-11f0-84e9-7c4d8f3425e6', 'James Mumo', 'james.mumo@strathmore.edu', '$2b$10$DgxlIEKpzFThnke/Wzp6qejFj5UNGrF3SBkdCqOct92n9LuW2TBs6', 'expert', '[\"drawing\"]', 'I am a very talented individual in drawing and i\'m really passionate about it', '1751967100178-Alicia laundry solutions Ltd 4...pptx,1751967100825-wallhaven-3warriors.png', 1, NULL, NULL, 1, '581127cf279a553b4d1b3f36ebcc018d8c680a86b91837276afc341e2ef282f7', 2000.00, '2025-07-08 09:31:42'),
('61b2747b-5bd8-11f0-84e9-7c4d8f3425e6', 'Muhammad Abdalla', 'muhammad.abdalla@strathmore.edu', '$2b$10$mpGXLwOgfXZlHX9DrOzcWeOIwXJGs9z7Nqi2ghdlVak5r7P0zuDRC', 'expert', '[\"Ai\"]', 'I\'m a proffesional  prompt engineer. I can do your assignments for you ofc at a price. Double rates for Indians', '1751964519495-6 - Adv. DB - Security v.624241015A.pdf', 1, NULL, NULL, 1, NULL, 100000.00, '2025-07-08 08:48:55'),
('74db2c13-5bd9-11f0-84e9-7c4d8f3425e6', 'elvis wafuke', 'elviswafuke@strathmore.edu', '$2b$10$M50CGkPYnCmYVLUTAN8lxOE.uChW7QAad..lumMCTzdb5P17U/VOS', 'expert', '[\"robotics\"]', 'i make robots', '1751964997334-download (8).jpeg', -1, NULL, NULL, 1, 'b52e80c4ff2c89bc311d75ac8a2716ce0ea3b2ccef42517dbd31762c9841120f', 100.00, '2025-07-08 08:56:37'),
('76462b7b-58c6-11f0-9eba-7c4d8f3425e6', 'Ryan Gich', 'ryan.gicheru@strathmore.edu', '$2b$10$JWkFsY5StIlKZ40EXEBZfeFnnJeJrTdu9fQ3L7qztHn4kH6ywIGEK', 'admin', 'admin', NULL, NULL, 1, NULL, NULL, 1, NULL, NULL, '2025-07-07 03:39:38'),
('abdeb5dd-5bdd-11f0-84e9-7c4d8f3425e6', 'Billiart Mwangi', 'billiart.mwangi@strathmore.edu', '$2b$10$bQSGOELIFM5df67FJGoYrOmVroRUGc6B4wxIjZFACaY0fe3pCBeBa', 'expert', '[\"Ai\",\"web-dev\"]', 'I teach how to build AI models and web applications from scratch', '1751966807621-.env', 0, NULL, NULL, 1, '5c8f1d647261bc9e6d6fd586549063498c2ef8d77b015233f20da7e6ea08804b', 300.00, '2025-07-08 09:26:47'),
('b2a89109-5bd7-11f0-84e9-7c4d8f3425e6', 'Brian Njehia Nyoike.', 'brian.njehia@strathmore.edu', '$2b$10$ixdRFtzMHHPXyFFEvCjIcO6BTwl06/osmm/1DIZ/7MjorreZr1fI.', 'student', '[\"web-dev\"]', NULL, NULL, 0, NULL, NULL, 1, NULL, NULL, '2025-07-08 08:44:02');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activities_ibfk_1` (`user_id`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation` (`user1_id`,`user2_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `mpesa_payments`
--
ALTER TABLE `mpesa_payments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_ibfk_1` (`user_id`);

--
-- Indexes for table `session_feedback`
--
ALTER TABLE `session_feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `session_id` (`session_id`);

--
-- Indexes for table `session_requests`
--
ALTER TABLE `session_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skill_id` (`skill_id`),
  ADD KEY `session_requests_ibfk_1` (`student_id`),
  ADD KEY `session_requests_ibfk_2` (`expert_id`);

--
-- Indexes for table `skills`
--
ALTER TABLE `skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `skills_ibfk_1` (`expert_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

--
-- AUTO_INCREMENT for table `mpesa_payments`
--
ALTER TABLE `mpesa_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `session_feedback`
--
ALTER TABLE `session_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `session_requests`
--
ALTER TABLE `session_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `skills`
--
ALTER TABLE `skills`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1750;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `session_feedback`
--
ALTER TABLE `session_feedback`
  ADD CONSTRAINT `session_feedback_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `session_requests` (`id`);

--
-- Constraints for table `session_requests`
--
ALTER TABLE `session_requests`
  ADD CONSTRAINT `session_requests_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `session_requests_ibfk_2` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `session_requests_ibfk_3` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`);

--
-- Constraints for table `skills`
--
ALTER TABLE `skills`
  ADD CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
