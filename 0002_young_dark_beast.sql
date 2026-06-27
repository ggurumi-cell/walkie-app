CREATE TABLE `walkie_announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`senderId` int NOT NULL,
	`senderName` varchar(100) NOT NULL,
	`priority` enum('normal','urgent') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `walkie_announcements_id` PRIMARY KEY(`id`)
);
