CREATE TABLE `walkie_group_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `walkie_group_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walkie_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walkie_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `walkie_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`employeeId` varchar(50) NOT NULL,
	`authCode` varchar(50) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `walkie_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `walkie_users_employeeId_unique` UNIQUE(`employeeId`)
);
