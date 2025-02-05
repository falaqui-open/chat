CREATE DATABASE flq;
USE flq;

--
-- Table structure for table `appconfig`
--
CREATE TABLE `appconfig` (
  `MarketId` varchar(10) NOT NULL,
  `MinVersionNumber` int NOT NULL,
  `MinVersionNumberANDROID` int DEFAULT NULL,
  `MinVersionNumberIOS` int DEFAULT NULL,
  `GooglePlayURL` varchar(2000) DEFAULT NULL,
  `AppleStoreURL` varchar(2000) DEFAULT NULL,
  `Website` varchar(2000) DEFAULT NULL,
  `HideSensitiveStoreDeploy` int DEFAULT NULL,
  PRIMARY KEY (`MarketId`),
  KEY `AppConfig_MarketId_IDX` (`MarketId`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
;

--
-- Data for table `appconfig`
--
LOCK TABLES `appconfig` WRITE;
INSERT INTO `appconfig` VALUES ('BR',0,12700,12700,'','https://apps.apple.com/br/app/falaqui/id6503642039','https://play.google.com/store/apps/details?id=com.br.falaqui',0);
UNLOCK TABLES;

--
-- Table structure for table `appgroupmembers`
--
CREATE TABLE `appgroupmembers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `GroupId` varchar(100) NOT NULL,
  `Login` varchar(100) NOT NULL,
  `IsAdmin` tinyint NOT NULL,
  `MessagePermission` tinyint NOT NULL,
  `HasUserValidity` int NOT NULL DEFAULT '0',
  `HasUserValidityFromDate` int NOT NULL DEFAULT '0',
  `UserValidityFromDate` timestamp NULL DEFAULT NULL,
  `HasUserValidityBetween` int NOT NULL DEFAULT '0',
  `UserValidityBetweenDateStart` timestamp NULL DEFAULT NULL,
  `UserValidityBetweenDateEnd` timestamp NULL DEFAULT NULL,
  `WaitingLoginApproval` tinyint NOT NULL,
  `LoginApproved` tinyint NOT NULL,
  `Removed` tinyint NOT NULL,
  `GroupExited` tinyint NOT NULL DEFAULT '0',
  `StatusDelivered` int NOT NULL,
  `DeleteStatusDelivered` int NOT NULL DEFAULT '1',
  `ExitedStatusDelivered` int NOT NULL DEFAULT '1',
  `GroupDelStatusDelivered` int NOT NULL DEFAULT '1',
  `CreationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `InsertDate` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `AppGroupMembers_GroupId_IDX` (`GroupId`) USING BTREE,
  KEY `AppGroupMembers_Login_IDX` (`Login`) USING BTREE,
  KEY `AppGroupMembers_WaitingLoginApproval_IDX` (`WaitingLoginApproval`) USING BTREE,
  KEY `AppGroupMembers_LoginApproved_IDX` (`LoginApproved`) USING BTREE,
  KEY `AppGroupMembers_GroupId_Login_IDX` (`GroupId`,`Login`) USING BTREE,
  KEY `AppGroupMembers_GroupId_WA_IDX` (`GroupId`,`WaitingLoginApproval`) USING BTREE,
  KEY `AppGroupMembers_GroupId_Login_WA_IDX` (`GroupId`,`Login`,`WaitingLoginApproval`) USING BTREE,
  KEY `AppGroupMembers_GroupId_Login_LA_IDX` (`GroupId`,`Login`,`LoginApproved`) USING BTREE,
  KEY `AppGroupMembers_Login_StatusDelivered_IDX` (`Login`,`StatusDelivered`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=483 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Table structure for table `appgroups`
--
CREATE TABLE `appgroups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `GroupId` varchar(100) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NOT NULL,
  `Photo` blob NOT NULL,
  `CreatorAdminLogin` varchar(100) NOT NULL,
  `PrivateKey` varchar(3000) DEFAULT NULL,
  `HasGroupValidity` int NOT NULL DEFAULT '0',
  `HasGroupValidityFromDate` int NOT NULL DEFAULT '0',
  `ValidityFromDate` timestamp NULL DEFAULT NULL,
  `HasGroupValidityBetween` int NOT NULL DEFAULT '0',
  `ValidityBetweenDateStart` timestamp NULL DEFAULT NULL,
  `ValidityBetweenDateEnd` timestamp NULL DEFAULT NULL,
  `HasGroupAccessHours` int NOT NULL DEFAULT '0',
  `GroupAccessHoursStart` int DEFAULT NULL,
  `GroupAccessHoursEnd` int DEFAULT NULL,
  `CreationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ModificationDate` timestamp NULL DEFAULT NULL,
  `UpdateLogin` varchar(100) DEFAULT NULL,
  `UpdatedDate` timestamp NULL DEFAULT NULL,
  `DeleteLogin` varchar(100) DEFAULT NULL,
  `DeleteDate` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `AppGroups_GroupId_IDX` (`GroupId`) USING BTREE,
  KEY `AppGroups_Name_IDX` (`Name`) USING BTREE,
  KEY `AppGroups_AdministratorLogin_IDX` (`CreatorAdminLogin`) USING BTREE,
  KEY `AppGroups_CreationDate_IDX` (`CreationDate`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=295 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Table structure for table `audiofilestorage`
--
CREATE TABLE `audiofilestorage` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `FileId` varchar(100) NOT NULL,
  `Login` varchar(100) NOT NULL,
  `FileBaseName` varchar(255) NOT NULL,
  `FilePath` varchar(2000) NOT NULL,
  `LengthInSeconds` int NOT NULL,
  `Transcription` text,
  `CreationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `AudioFileStorage_FileId_IDX` (`FileId`) USING BTREE,
  KEY `AudioFileStorage_Login_IDX` (`Login`) USING BTREE,
  KEY `AudioFileStorage_FileId_Login_IDX` (`FileId`,`Login`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=948 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `company`
--
CREATE TABLE `company` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `CompanyId` varchar(100) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `AdminLogin` varchar(100) NOT NULL,
  `DataLakeHost` varchar(100) DEFAULT NULL,
  `DataLakePort` int DEFAULT NULL,
  `DataLakeUser` varchar(100) DEFAULT NULL,
  `DataLakePassword` varchar(100) DEFAULT NULL,
  `DataLakeReadOnlyUser` varchar(100) DEFAULT NULL,
  `DataLakeReadOnlyPassword` varchar(100) DEFAULT NULL,
  `DataLakeDBName` varchar(100) DEFAULT NULL,
  `DataLakeRemoteUser` varchar(100) DEFAULT NULL,
  `DataLakeRemotePassword` varchar(100) DEFAULT NULL,
  `ExternalEndpoint` int DEFAULT NULL,
  `AccessCode` varchar(100) DEFAULT NULL,
  `Endpoint` varchar(255) DEFAULT NULL,
  `SocketEndpoint` varchar(255) DEFAULT NULL,
  `CreationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Company_CompanyId_IDX` (`CompanyId`) USING BTREE,
  KEY `Company_Name_IDX` (`Name`) USING BTREE,
  KEY `Company_AdminLogin_IDX` (`AdminLogin`) USING BTREE,
  KEY `Company_CreationDate_IDX` (`CreationDate`) USING BTREE,
  KEY `Company_ExternalEndpoint_IDX` (`ExternalEndpoint`) USING BTREE,
  KEY `Company_AccessCode_IDX` (`AccessCode`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Table structure for table `companylogo`
--
CREATE TABLE `companylogo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `CompanyId` varchar(100) NOT NULL,
  `LogoURL` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CompanyLogo_CompanyId_IDX` (`CompanyId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `companymembers`
--
CREATE TABLE `companymembers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `CompanyId` varchar(100) NOT NULL,
  `Login` varchar(100) NOT NULL,
  `PrivateKey` varchar(3000) DEFAULT NULL,
  `IsAdmin` int DEFAULT NULL,
  `IsExternal` tinyint NOT NULL DEFAULT '0',
  `MemberCompanyName` varchar(100) DEFAULT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `Position` varchar(100) DEFAULT NULL,
  `Updated` int DEFAULT NULL,
  `Removed` int DEFAULT NULL,
  `ModificationDate` timestamp NULL DEFAULT NULL,
  `CreateRegisterLogin` varchar(100) DEFAULT NULL,
  `CreateRegisterDate` timestamp NULL DEFAULT NULL,
  `UpdateLogin` varchar(100) DEFAULT NULL,
  `UpdatedDate` timestamp NULL DEFAULT NULL,
  `DeleteLogin` varchar(100) DEFAULT NULL,
  `DeleteDate` timestamp NULL DEFAULT NULL,
  `InsertLogin` varchar(100) DEFAULT NULL,
  `InsertDate` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CompanyMembers_CompanyId_IDX` (`CompanyId`) USING BTREE,
  KEY `CompanyMembers_Login_IDX` (`Login`) USING BTREE,
  KEY `CompanyMembers_CompanyId_Login_IDX` (`CompanyId`,`Login`) USING BTREE,
  KEY `CompanyMembers_Login_Updated_IDX` (`Login`,`Updated`) USING BTREE,
  KEY `CompanyMembers_Login_Removed_IDX` (`Login`,`Removed`) USING BTREE,
  KEY `CompanyMembers_Login_ModificationDate_IDX` (`Login`,`ModificationDate`) USING BTREE,
  KEY `CompanyMembers_IsExternal_IDX` (`IsExternal`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_IDX` (`CompanyId`,`IsExternal`) USING BTREE,
  KEY `CompanyMembers_MemberCompanyName_IDX` (`MemberCompanyName`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_MemberCompanyName_IDX` (`CompanyId`,`IsExternal`,`MemberCompanyName`) USING BTREE,
  KEY `CompanyMembers_Department_IDX` (`Department`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_Department_IDX` (`CompanyId`,`IsExternal`,`Department`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_CompanyName_Department_IDX` (`CompanyId`,`IsExternal`,`MemberCompanyName`,`Department`) USING BTREE,
  KEY `CompanyMembers_Position_IDX` (`Position`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_Position_IDX` (`CompanyId`,`IsExternal`,`Position`) USING BTREE,
  KEY `CompanyMembers_CompanyId_IsExternal_CompanyName_Position_IDX` (`CompanyId`,`IsExternal`,`MemberCompanyName`,`Position`) USING BTREE,
  KEY `CompanyLogo_CompanyId_IDX` (`CompanyId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `contacts`
--
CREATE TABLE `contacts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `User` varchar(100) NOT NULL,
  `Contact` varchar(100) NOT NULL,
  `Nickname` varchar(100) DEFAULT NULL,
  `Pin` int DEFAULT NULL,
  `PrivateKey` varchar(3000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Contacts_User_IDX` (`User`) USING BTREE,
  KEY `Contacts_Contact_IDX` (`Contact`) USING BTREE,
  KEY `Contacts_User_Contact_IDX` (`User`,`Contact`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=707 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `contactservedbycompany`
--
CREATE TABLE `contactservedbycompany` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `User` varchar(100) NOT NULL,
  `Contact` varchar(100) NOT NULL,
  `Company` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ContactServedByCompany_User_IDX` (`User`) USING BTREE,
  KEY `ContactServedByCompany_Contact_IDX` (`Contact`) USING BTREE,
  KEY `ContactServedByCompany_User_Contact_IDX` (`User`,`Contact`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `imagefilestorage`
--
CREATE TABLE `imagefilestorage` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `FileId` varchar(100) NOT NULL,
  `Login` varchar(100) NOT NULL,
  `FileBaseName` varchar(255) NOT NULL,
  `FilePath` varchar(2000) NOT NULL,
  `FileThumbPath` varchar(2000) NOT NULL,
  `CreationDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ImageFileStorage_FileId_IDX` (`FileId`) USING BTREE,
  KEY `ImageFileStorage_Login_IDX` (`Login`) USING BTREE,
  KEY `ImageFileStorage_FileId_Login_IDX` (`FileId`,`Login`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=156 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `messagecarrier`
--
CREATE TABLE `messagecarrier` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `MessageId` varchar(100) NOT NULL,
  `FromId` varchar(100) NOT NULL,
  `ToId` varchar(100) NOT NULL,
  `Content` text NOT NULL,
  `Protected` int NOT NULL,
  `MessageTime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Media` text,
  `MediaType` int DEFAULT NULL,
  `InReplyToMessageId` varchar(100) DEFAULT NULL,
  `ToIsGroup` int DEFAULT NULL,
  `StatusDelivered` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `MessageCarrier_MessageId_IDX` (`MessageId`) USING BTREE,
  KEY `MessageCarrier_FromId_IDX` (`FromId`) USING BTREE,
  KEY `MessageCarrier_ToId_IDX` (`ToId`) USING BTREE,
  KEY `MessageCarrier_StatusDelivered_IDX` (`StatusDelivered`) USING BTREE,
  KEY `MessageCarrier_FromId_ToId_IDX` (`FromId`,`ToId`) USING BTREE,
  KEY `MessageCarrier_FromId_StatusDelivered_IDX` (`FromId`,`StatusDelivered`) USING BTREE,
  KEY `MessageCarrier_ToId_StatusDelivered_IDX` (`ToId`,`StatusDelivered`) USING BTREE,
  KEY `MessageCarrier_FromId_ToId_StatusDelivered_IDX` (`FromId`,`ToId`,`StatusDelivered`) USING BTREE,
  KEY `MessageCarrier_MessageId_StatusDelivered_IDX` (`MessageId`,`StatusDelivered`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2784 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Table structure for table `pendingreceivemessagefromgroup`
--
CREATE TABLE `pendingreceivemessagefromgroup` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `Login` varchar(100) NOT NULL,
  `GroupId` varchar(100) NOT NULL,
  `MessageId` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PendingReceiveMessageFromGroup_Login_IDX` (`Login`) USING BTREE,
  KEY `PendingReceiveMessageFromGroup_GroupId_IDX` (`GroupId`) USING BTREE,
  KEY `PendingReceiveMessageFromGroup_Login_GroupId_IDX` (`Login`,`GroupId`) USING BTREE,
  KEY `PendingReceiveMessageFromGroup_MessageId_IDX` (`MessageId`) USING BTREE,
  KEY `PendingReceiveMessageFromGroup_MessageId_GroupId_IDX` (`MessageId`,`GroupId`) USING BTREE,
  KEY `PendingReceiveMessageFromGroup_Login_GroupId_MessageId_IDX` (`Login`,`GroupId`,`MessageId`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1904 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


--
-- Table structure for table `userbackup`
--
CREATE TABLE `userbackup` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `Login` varchar(100) NOT NULL,
  `Instruction` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserBackup_Login_IDX` (`Login`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3485325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




--
-- Table structure for table `userdeviceinfo`
--
CREATE TABLE `userdeviceinfo` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `Login` varchar(100) NOT NULL,
  `DeviceUUID` varchar(500) NOT NULL,
  `Platform` varchar(20) NOT NULL,
  `FCMToken` varchar(500) NOT NULL,
  `BadgeCount` int DEFAULT NULL,
  `LastCompany` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `UserDeviceInfo_Login_IDX` (`Login`) USING BTREE,
  KEY `UserDeviceInfo_DeviceUUID_IDX` (`DeviceUUID`) USING BTREE,
  KEY `UserDeviceInfo_Login_DeviceUUID_IDX` (`Login`,`DeviceUUID`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=525 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `users`
--
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `Login` varchar(100) NOT NULL,
  `LoginMode` varchar(10) NOT NULL,
  `Password` varchar(256) NOT NULL,
  `TaxId` varchar(100) NOT NULL,
  `Name` varchar(256) NOT NULL,
  `Photo` blob NOT NULL,
  `MobilePhone` varchar(100) NOT NULL,
  `Email` varchar(256) NOT NULL,
  `CountryCode` varchar(10) NOT NULL,
  `BirthDate` date DEFAULT NULL,
  `TermsOfUseVersion` varchar(10) NOT NULL,
  `AntiMoneyLaunderingTerroristFinancingPolicyVersion` varchar(10) NOT NULL,
  `PrivacyPolicyVersion` varchar(10) NOT NULL,
  `InformationSecurityPolicyVersion` varchar(10) NOT NULL,
  `ResetPasswordCode` varchar(10) DEFAULT NULL,
  `PhoneValidationCode` varchar(10) DEFAULT NULL,
  `CreationDate` datetime NOT NULL,
  `Locked` tinyint NOT NULL,
  `ForceLogout` tinyint DEFAULT NULL,
  PRIMARY KEY (`Login`),
  KEY `id` (`id`),
  KEY `Users_Login_IDX` (`Login`) USING BTREE,
  KEY `Users_Login_Password_IDX` (`Login`,`Password`) USING BTREE,
  KEY `Users_TaxId_IDX` (`TaxId`) USING BTREE,
  KEY `Users_Email_IDX` (`Email`) USING BTREE,
  KEY `Users_CountryCode_IDX` (`CountryCode`) USING BTREE,
  KEY `Users_Login_CountryCode_IDX` (`Login`,`CountryCode`) USING BTREE,
  KEY `Users_MobilePhone_IDX` (`MobilePhone`) USING BTREE,
  KEY `Users_Login_TaxId_IDX` (`Login`,`TaxId`) USING BTREE,
  KEY `Users_Login_MobilePhone_IDX` (`Login`,`MobilePhone`) USING BTREE,
  KEY `Users_Login_Email_IDX` (`Login`,`Email`) USING BTREE,
  KEY `Users_ResetPasswordCode_IDX` (`ResetPasswordCode`) USING BTREE,
  KEY `Users_PhoneValidationCode_IDX` (`PhoneValidationCode`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1096 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



--
-- Table structure for table `versionnews`
--
CREATE TABLE `versionnews` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `Version` varchar(10) NOT NULL,
  `Content` mediumtext,
  PRIMARY KEY (`id`),
  KEY `VersionNews_version_IDX` (`Version`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
