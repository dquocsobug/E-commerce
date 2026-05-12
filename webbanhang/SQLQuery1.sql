-- ==============================
-- DATABASE WEB BÁN HÀNG
-- ==============================

-- Xóa DB nếu đã tồn tại
IF EXISTS (SELECT * FROM sys.databases WHERE name = 'WebBanHang')
BEGIN
    DROP DATABASE WebBanHang;
END
GO

-- Tạo database
CREATE DATABASE WebBanHang;
GO

USE WebBanHang;
GO

-- ==============================
-- 1. USERS (KHÁCH HÀNG + ADMIN)
-- ==============================
CREATE TABLE Users (
    UserID INT IDENTITY PRIMARY KEY,
    FullName NVARCHAR(100),
    Email NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Phone NVARCHAR(20),
    Address NVARCHAR(255),
    Role NVARCHAR(20) DEFAULT 'USER', -- USER / ADMIN
    CreatedAt DATETIME DEFAULT GETDATE()
);

-- ==============================
-- 2. DANH MỤC
-- ==============================
CREATE TABLE Categories (
    CategoryID INT IDENTITY PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(255)
);

-- ==============================
-- 3. SẢN PHẨM
-- ==============================
CREATE TABLE Products (
    ProductID INT IDENTITY PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    Stock INT DEFAULT 0,
    ImageURL NVARCHAR(255),
    CategoryID INT,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- ==============================
-- 4. GIỎ HÀNG
-- ==============================
CREATE TABLE Carts (
    CartID INT IDENTITY PRIMARY KEY,
    UserID INT,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ==============================
-- 5. CHI TIẾT GIỎ HÀNG
-- ==============================
CREATE TABLE CartItems (
    CartItemID INT IDENTITY PRIMARY KEY,
    CartID INT,
    ProductID INT,
    Quantity INT DEFAULT 1,

    FOREIGN KEY (CartID) REFERENCES Carts(CartID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 6. ĐƠN HÀNG
-- ==============================
CREATE TABLE Orders (
    OrderID INT IDENTITY PRIMARY KEY,
    UserID INT,
    TotalAmount DECIMAL(18,2),
    Status NVARCHAR(50) DEFAULT 'Pending', -- Pending, Completed, Cancelled
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ==============================
-- 7. CHI TIẾT ĐƠN HÀNG
-- ==============================
CREATE TABLE OrderDetails (
    OrderDetailID INT IDENTITY PRIMARY KEY,
    OrderID INT,
    ProductID INT,
    Quantity INT,
    Price DECIMAL(18,2),

    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 8. ĐÁNH GIÁ
-- ==============================
CREATE TABLE Reviews (
    ReviewID INT IDENTITY PRIMARY KEY,
    UserID INT,
    ProductID INT,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 9. BÌNH LUẬN
-- ==============================
CREATE TABLE Comments (
    CommentID INT IDENTITY PRIMARY KEY,
    UserID INT,
    ProductID INT,
    Content NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 10. KHUYẾN MÃI
-- ==============================
CREATE TABLE Promotions (
    PromotionID INT IDENTITY PRIMARY KEY,
    PromotionName NVARCHAR(255),
    DiscountPercent INT,
    StartDate DATETIME,
    EndDate DATETIME
);

-- ==============================
-- 11. ÁP DỤNG KHUYẾN MÃI
-- ==============================
CREATE TABLE ProductPromotions (
    ID INT IDENTITY PRIMARY KEY,
    ProductID INT,
    PromotionID INT,

    FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID)
);

-- ==============================
-- 12. BÀI VIẾT (ADMIN)
-- ==============================
CREATE TABLE Posts (
    PostID INT IDENTITY PRIMARY KEY,
    Title NVARCHAR(255),
    Content NVARCHAR(MAX),
    ImageURL NVARCHAR(255),
    CreatedBy INT,
    CreatedAt DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- ==============================
-- 13. DỮ LIỆU MẪU
-- ==============================

-- Admin
INSERT INTO Users (FullName, Email, Password, Role)
VALUES (N'Admin', 'admin@gmail.com', '123456', 'ADMIN');

-- User
INSERT INTO Users (FullName, Email, Password)
VALUES (N'Nguyễn Văn A', 'user@gmail.com', '123456');

-- Category
INSERT INTO Categories (CategoryName) VALUES (N'Áo');
INSERT INTO Categories (CategoryName) VALUES (N'Quần');

-- Product
INSERT INTO Products (ProductName, Price, Stock, CategoryID)
VALUES (N'Áo thun', 150000, 100, 1);

INSERT INTO Products (ProductName, Price, Stock, CategoryID)
VALUES (N'Quần jean', 300000, 50, 2);

-- ==============================
-- 14. TẠO LOGIN (TRÁNH LỖI SA)
-- ==============================
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'webuser')
BEGIN
    CREATE LOGIN webuser WITH PASSWORD = '123456';
END
GO

USE WebBanHang;
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'webuser')
BEGIN
    CREATE USER webuser FOR LOGIN webuser;
    ALTER ROLE db_owner ADD MEMBER webuser;
END
GO

-- ==============================
-- DONE
-- ==============================
PRINT N'✅ Database WebBanHang đã được tạo thành công!';