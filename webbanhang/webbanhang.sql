-- ==============================
-- DATABASE WEB BÁN HÀNG
-- Chuẩn snake_case khớp với Java Entity
-- ==============================

IF EXISTS (SELECT * FROM sys.databases WHERE name = 'WebBanHang')
BEGIN
    DROP DATABASE WebBanHang;
END
GO

CREATE DATABASE WebBanHang;
GO

USE WebBanHang;
GO

-- ==============================
-- 1. USERS
-- ==============================
CREATE TABLE Users (
    UserID       INT           IDENTITY PRIMARY KEY,
    FullName     NVARCHAR(100),
    Email        NVARCHAR(100) UNIQUE NOT NULL,
    Password     NVARCHAR(255) NOT NULL,
    Phone        NVARCHAR(20),
    Address      NVARCHAR(255),
    Role         NVARCHAR(20)  DEFAULT 'USER',
    CreatedAt    DATETIME      DEFAULT GETDATE()
);

-- ==============================
-- 2. CATEGORIES
-- ==============================
CREATE TABLE Categories (
    CategoryID   INT           IDENTITY PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    Description  NVARCHAR(255)
);

-- ==============================
-- 3. PRODUCTS
-- ==============================
CREATE TABLE Products (
    ProductID   INT              IDENTITY PRIMARY KEY,
    ProductName NVARCHAR(255)    NOT NULL,
    Description NVARCHAR(MAX),
    Price       DECIMAL(18,2)    NOT NULL,
    Stock       INT              DEFAULT 0,
    ImageURL    NVARCHAR(255),
    CategoryID  INT,
    CreatedAt   DATETIME         DEFAULT GETDATE(),

    CONSTRAINT FK_Products_Categories
        FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

-- ==============================
-- 4. CARTS
-- ==============================
CREATE TABLE Carts (
    CartID    INT      IDENTITY PRIMARY KEY,
    UserID    INT,
    CreatedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Carts_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ==============================
-- 5. CART_ITEMS
-- ==============================
CREATE TABLE CartItems (
    CartItemID INT IDENTITY PRIMARY KEY,
    CartID     INT,
    ProductID  INT,
    Quantity   INT DEFAULT 1,

    CONSTRAINT FK_CartItems_Carts
        FOREIGN KEY (CartID)    REFERENCES Carts(CartID),
    CONSTRAINT FK_CartItems_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 6. ORDERS
-- ==============================
CREATE TABLE Orders (
    OrderID     INT           IDENTITY PRIMARY KEY,
    UserID      INT,
    TotalAmount DECIMAL(18,2),
    Status      NVARCHAR(50)  DEFAULT 'Pending',
    CreatedAt   DATETIME      DEFAULT GETDATE(),

    CONSTRAINT FK_Orders_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- ==============================
-- 7. ORDER_DETAILS
-- ==============================
CREATE TABLE OrderDetails (
    OrderDetailID INT           IDENTITY PRIMARY KEY,
    OrderID       INT,
    ProductID     INT,
    Quantity      INT,
    Price         DECIMAL(18,2),

    CONSTRAINT FK_OrderDetails_Orders
        FOREIGN KEY (OrderID)   REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderDetails_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 8. REVIEWS
-- ==============================
CREATE TABLE Reviews (
    ReviewID  INT          IDENTITY PRIMARY KEY,
    UserID    INT,
    ProductID INT,
    Rating    INT          CHECK (Rating BETWEEN 1 AND 5),
    Comment   NVARCHAR(MAX),
    CreatedAt DATETIME     DEFAULT GETDATE(),

    CONSTRAINT FK_Reviews_Users
        FOREIGN KEY (UserID)    REFERENCES Users(UserID),
    CONSTRAINT FK_Reviews_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 9. COMMENTS
-- ==============================
CREATE TABLE Comments (
    CommentID INT          IDENTITY PRIMARY KEY,
    UserID    INT,
    ProductID INT,
    Content   NVARCHAR(MAX),
    CreatedAt DATETIME     DEFAULT GETDATE(),

    CONSTRAINT FK_Comments_Users
        FOREIGN KEY (UserID)    REFERENCES Users(UserID),
    CONSTRAINT FK_Comments_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID)
);

-- ==============================
-- 10. PROMOTIONS
-- ==============================
CREATE TABLE Promotions (
    PromotionID     INT          IDENTITY PRIMARY KEY,
    PromotionName   NVARCHAR(255),
    DiscountPercent INT,
    StartDate       DATETIME,
    EndDate         DATETIME
);

-- ==============================
-- 11. PRODUCT_PROMOTIONS
-- ==============================
CREATE TABLE ProductPromotions (
    ID          INT IDENTITY PRIMARY KEY,
    ProductID   INT,
    PromotionID INT,

    CONSTRAINT FK_ProductPromotions_Products
        FOREIGN KEY (ProductID)   REFERENCES Products(ProductID),
    CONSTRAINT FK_ProductPromotions_Promotions
        FOREIGN KEY (PromotionID) REFERENCES Promotions(PromotionID)
);

-- ==============================
-- 12. POSTS
-- ==============================
CREATE TABLE Posts (
    PostID    INT          IDENTITY PRIMARY KEY,
    Title     NVARCHAR(255),
    Content   NVARCHAR(MAX),
    ImageURL  NVARCHAR(255),
    CreatedBy INT,
    CreatedAt DATETIME     DEFAULT GETDATE(),

    CONSTRAINT FK_Posts_Users
        FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

-- ==============================
-- 13. DỮ LIỆU MẪU
-- ==============================

-- Admin (password sẽ được hash bởi BCrypt khi login thật)
-- Dùng BCrypt hash của '123456' để đăng nhập đúng qua API
INSERT INTO Users (FullName, Email, Password, Role)
VALUES (N'Admin', 'admin@gmail.com',
        '$2a$10$QftujF3fhrxxPaG55zzBxO8I4mLN08mAmHDccjKLuroZeOQG9QzJ2',
        'ADMIN');

INSERT INTO Users (FullName, Email, Password, Role)
VALUES (N'Nguyễn Văn A', 'user@gmail.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'USER');

-- Categories
INSERT INTO Categories (CategoryName, Description) 
VALUES (N'Tai Nghe', N'Các loại tai nghe Bluetooth, có dây, chống ồn');

INSERT INTO Categories (CategoryName, Description) 
VALUES (N'Điện Thoại', N'Các dòng điện thoại thông minh');

INSERT INTO Categories (CategoryName, Description) 
VALUES (N'Phụ kiện', N'Các loại phụ kiện công nghệ: sạc, cáp, pin dự phòng...');

-- Products (Tai Nghe - CategoryID = 1)
INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
VALUES (N'AirPods Pro 2', N'Tai nghe không dây chống ồn chủ động, âm thanh chất lượng cao', 5500000, 50, 'a1.jpg', 1);

INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
VALUES (N'Sony WH-1000XM5', N'Tai nghe over-ear chống ồn tốt nhất, pin lâu', 8500000, 30, 'a2.jpg', 1);

-- Products (Điện Thoại - CategoryID = 2)
INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
VALUES (N'iPhone 15', N'Điện thoại Apple, chip A16 Bionic, camera sắc nét', 22000000, 40, 'a3.jpg', 2);

INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
VALUES (N'Samsung Galaxy S24', N'Flagship Samsung, hiệu năng mạnh, camera AI', 20000000, 35, 'a4.jpg', 2);

-- Products (Phụ kiện - CategoryID = 3)
INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
VALUES (N'Sạc nhanh Anker 65W', N'Sạc nhanh đa cổng USB-C, hỗ trợ laptop và điện thoại', 750000, 100, 'a5.jpg', 3);

-- Reviews (User đánh giá sản phẩm)
INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES (2, 1, 5, N'Tai nghe rất xịn, chống ồn tốt, pin lâu');

INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES (2, 2, 4, N'Âm thanh tốt nhưng giá hơi cao');

INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES (2, 3, 5, N'iPhone chạy mượt, camera đẹp');

INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES (2, 4, 4, N'Samsung nhiều tính năng, dùng ổn');

INSERT INTO Reviews (UserID, ProductID, Rating, Comment)
VALUES (2, 5, 5, N'Sạc nhanh thật sự rất tiện, dùng tốt cho laptop');

-- Comments (Bình luận sản phẩm)
INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 1, N'Có ai dùng AirPods Pro 2 lâu chưa? có bị chai pin không?');

INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 1, N'Tai nghe này kết nối iPhone có bị lag không mọi người?');

INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 2, N'Sony XM5 có đáng mua hơn Bose QC45 không?');

INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 3, N'iPhone 15 bản thường có nóng máy không?');

INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 4, N'S24 camera chụp đêm có tốt không?');

INSERT INTO Comments (UserID, ProductID, Content)
VALUES (2, 5, N'Sạc Anker này có dùng được MacBook không?');

-- Promotions (khuyến mãi theo thời gian)
INSERT INTO Promotions (PromotionName, DiscountPercent, StartDate, EndDate)
VALUES (N'Sale Tết 2026', 25, '2026-01-20 00:00:00', '2026-02-10 23:59:59');

INSERT INTO Promotions (PromotionName, DiscountPercent, StartDate, EndDate)
VALUES (N'Back To School', 15, '2026-08-01 00:00:00', '2026-09-15 23:59:59');

INSERT INTO Promotions (PromotionName, DiscountPercent, StartDate, EndDate)
VALUES (N'Black Friday Tech Sale', 40, '2026-11-25 00:00:00', '2026-11-30 23:59:59');

INSERT INTO Promotions (PromotionName, DiscountPercent, StartDate, EndDate)
VALUES (N'Flash Sale 4.4', 10, '2026-04-04 00:00:00', '2026-04-04 23:59:59');

-- Posts (bài viết tin tức công nghệ)
INSERT INTO Posts (Title, Content, ImageURL, CreatedBy)
VALUES 
(N'Top tai nghe chống ồn tốt nhất 2026',
N'Năm 2026, thị trường tai nghe chứng kiến sự cạnh tranh mạnh giữa Sony, Apple và Bose. 
Các dòng tai nghe chống ồn ngày càng cải tiến về AI lọc âm và thời lượng pin.',
'tai-nghe-2026.jpg',
1);

INSERT INTO Posts (Title, Content, ImageURL, CreatedBy)
VALUES 
(N'Có nên mua iPhone 15 trong năm 2026?',
N'iPhone 15 vẫn là lựa chọn ổn định với hiệu năng mạnh, camera tốt và hệ sinh thái Apple. 
Tuy nhiên, iPhone 16 sắp ra mắt có thể là lựa chọn tốt hơn.',
'iphone-15-review.jpg',
1);

INSERT INTO Posts (Title, Content, ImageURL, CreatedBy)
VALUES 
(N'Samsung Galaxy S24 có gì mới?',
N'Galaxy S24 tập trung vào AI camera, xử lý hình ảnh thông minh và hiệu năng mạnh với chip Exynos mới.',
'galaxy-s24-news.jpg',
1);

INSERT INTO Posts (Title, Content, ImageURL, CreatedBy)
VALUES 
(N'Xu hướng phụ kiện công nghệ 2026',
N'Các phụ kiện như sạc nhanh GaN, pin dự phòng dung lượng cao và tai nghe không dây đang thống trị thị trường.',
'tech-accessories.jpg',
1);

-- Promotion mẫu
INSERT INTO Promotions (PromotionName, DiscountPercent, StartDate, EndDate)
VALUES (N'Sale hè 2026', 20, '2026-04-01 00:00:00', '2026-06-30 23:59:59');

-- Áp khuyến mãi cho sản phẩm 1 và 3
INSERT INTO ProductPromotions (ProductID, PromotionID) VALUES (1, 1);
INSERT INTO ProductPromotions (ProductID, PromotionID) VALUES (3, 1);

-- ==============================
-- 14. LOGIN SQL SERVER (tuỳ chọn)
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

PRINT N'Database WebBanHang da duoc tao thanh cong!';
