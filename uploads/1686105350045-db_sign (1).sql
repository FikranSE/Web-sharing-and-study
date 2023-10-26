-- phpMyAdmin SQL Dump
-- version 5.1.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 05, 2023 at 06:11 AM
-- Server version: 10.4.20-MariaDB
-- PHP Version: 8.0.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_sign`
--

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `document_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `documents`
--

INSERT INTO `documents` (`document_id`, `name`, `filename`, `description`, `created_at`, `updated_at`) VALUES
(1, 'tes', '1684637320935-Fikran Shadiq ElYafit_2111521024_TugasAsosiasi.pdf', 'tes', '2023-05-21 02:48:40.945929', '2023-05-21 02:48:40.945929'),
(2, 'tes', '1684637900546-Fikran Shadiq ElYafit_2111521024_TugasAsosiasi.pdf', 'tes', '2023-05-21 02:58:20.555127', '2023-05-21 02:58:20.555127'),
(3, 'asdas', '1684638297843-fikran(3).pdf', 'asds', '2023-05-21 03:04:57.850394', '2023-05-21 03:04:57.850394'),
(4, 'document webinar', '1684640308170-Fikran Shadiq ElYafit_2111521024_TugasAsosiasi.pdf', 'tolong ditanda tangani', '2023-05-21 03:38:28.197039', '2023-05-21 03:38:28.197039'),
(5, 'sad', '1684640379146-Fikran Shadiq ElYafit_2111521024_TugasAsosiasi.pdf', 'ini tugas', '2023-05-21 03:39:39.161986', '2023-05-21 03:39:39.161986');

-- --------------------------------------------------------

--
-- Table structure for table `signature`
--

CREATE TABLE `signature` (
  `user_id` int(11) NOT NULL,
  `document_id` int(11) NOT NULL,
  `jabatan` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `signed_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `signature`
--

INSERT INTO `signature` (`user_id`, `document_id`, `jabatan`, `status`, `signed_at`, `created_at`, `updated_at`) VALUES
(3, 4, 'sekretaris', 'belum kawin', '2023-05-21 03:38:28.204465', '2023-05-21 03:38:28.204465', '2023-05-21 03:38:28.204465'),
(3, 5, 'sekretaris', 'belum kawin', '2023-05-21 03:39:39.166840', '2023-05-21 03:39:39.166840', '2023-05-21 03:39:39.166840');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `active` int(10) NOT NULL,
  `avatar` varchar(255) NOT NULL,
  `sign_img` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password`, `active`, `avatar`, `sign_img`, `created_at`, `updated_at`) VALUES
(2, 'nisa', 'nisa@gmail.com', '$2b$10$TGtnudLOkUSd.zPfSw1h9ehmeZ49i2YdTRI1rTTzYxWy2AMhpGk9K', 0, '', '1684080209907-WhatsApp Image 2023-05-06 at 13.35.13.jpeg', '2023-05-14 14:05:59.719788', '2023-05-14 14:05:59.719788'),
(3, 'tiara', 'tiara@gmail.com', '$2b$10$.VOvMWrVtq5U0rNjBalnnOaLwD80LMPb8bPwkoVYgFXzGh7oaB8Xm', 0, '1685938061584-3.jpg', '1685938031313-signature.png', '2023-05-14 16:10:55.662164', '2023-05-14 16:10:55.662164'),
(4, 'tes', 'tes@gmail.com', '$2b$10$pW5dc.qAOtAMYj4RdXNknOiioOfGjyCgC0IcO1krHMgv7DnF1ErlG', 0, '', '', '2023-05-15 02:31:58.053641', '2023-05-15 02:31:58.053641'),
(5, 'kran', 'kran@gmail.com', '$2b$10$dPxtuUdNoee0STr8j0fp9ODyAk5o84CF1V57mLwWP8c9CiMN218M.', 0, '', '1684636346051-signature (3).png', '2023-05-19 12:37:22.578639', '2023-05-19 12:37:22.578639');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`document_id`);

--
-- Indexes for table `signature`
--
ALTER TABLE `signature`
  ADD PRIMARY KEY (`user_id`,`document_id`),
  ADD KEY `document_id` (`document_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `document_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `signature`
--
ALTER TABLE `signature`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `signature`
--
ALTER TABLE `signature`
  ADD CONSTRAINT `signature_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`),
  ADD CONSTRAINT `signature_ibfk_2` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
