import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { ProtectedRoute, RoleRoute } from "./ProtectedRoute";
import { PageLoader } from "../components/common";
import { ROLES } from "../utils/format";

const HomePage = lazy(() => import("../pages/HomePage"));
const ProductListPage = lazy(() => import("../pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage"));
const CartPage = lazy(() => import("../pages/CartPage"));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage"));
const OrderListPage = lazy(() => import("../pages/OrderListPage"));
const OrderDetailPage = lazy(() => import("../pages/OrderDetailPage"));
const PostListPage = lazy(() => import("../pages/PostListPage"));
const PostDetailPage = lazy(() => import("../pages/PostDetailPage"));
const PromotionsPage = lazy(() => import("../pages/PromotionsPage"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const RegisterPage = lazy(() => import("../pages/RegisterPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const MyPostsPage = lazy(() => import("../pages/MyPostsPage"));
const MyReviewsPage = lazy(() => import("../pages/MyReviewsPage"));
const WriterPostPage = lazy(() => import("../pages/WriterPostPage"));
const CreatePostPage = lazy(() => import("../pages/CreatePostPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const PaymentResultPage = lazy(() => import("../pages/PaymentResultPage"));

// Admin pages
const AdminLayout = lazy(() => import("../components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("../pages/admin/AdminDashboardPage"));
const AdminUserPage = lazy(() => import("../pages/admin/AdminUserPage"));
const AdminProductPage = lazy(() => import("../pages/admin/AdminProductPage"));
const AdminCategoryPage = lazy(() => import("../pages/admin/AdminCategoryPage"));
const AdminOrderPage = lazy(() => import("../pages/admin/AdminOrderPage"));
const AdminPostPage = lazy(() => import("../pages/admin/AdminPostPage"));
const AdminPromotionPage = lazy(() => import("../pages/admin/AdminPromotionPage"));
const AdminVoucherPage = lazy(() => import("../pages/admin/AdminVoucherPage"));

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(LoginPage),
  },
  {
    path: "/register",
    element: withSuspense(RegisterPage),
  },
  {
  path: "/payment/momo-return",
  element: withSuspense(PaymentResultPage),
  },

  {
    path: "/admin",
    element: (
      <RoleRoute roles={[ROLES.ADMIN]}>
        {withSuspense(AdminLayout)}
      </RoleRoute>
    ),
    children: [
      { index: true, element: withSuspense(AdminDashboardPage) },
      { path: "users", element: withSuspense(AdminUserPage) },
      { path: "products", element: withSuspense(AdminProductPage) },
      { path: "categories", element: withSuspense(AdminCategoryPage) },
      { path: "orders", element: withSuspense(AdminOrderPage) },
      { path: "posts", element: withSuspense(AdminPostPage) },
      { path: "promotions", element: withSuspense(AdminPromotionPage) },
      { path: "vouchers", element: withSuspense(AdminVoucherPage) },
    ],
  },

  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: "products", element: withSuspense(ProductListPage) },
      { path: "products/:id", element: withSuspense(ProductDetailPage) },
      { path: "posts", element: withSuspense(PostListPage) },
      { path: "posts/:id", element: withSuspense(PostDetailPage) },
      { path: "promotions", element: withSuspense(PromotionsPage) },

      {
        path: "cart",
        element: (
          <ProtectedRoute>
            {withSuspense(CartPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "checkout",
        element: (
          <ProtectedRoute>
            {withSuspense(CheckoutPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            {withSuspense(OrderListPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "orders/:id",
        element: (
          <ProtectedRoute>
            {withSuspense(OrderDetailPage)}
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            {withSuspense(ProfilePage)}
          </ProtectedRoute>
        ),
      },
      {
  path: "posts/my",
  element: (
    <ProtectedRoute>
      {withSuspense(MyPostsPage)}
    </ProtectedRoute>
  ),
},

{
  path: "reviews/my",
  element: (
    <ProtectedRoute>
      {withSuspense(MyReviewsPage)}
    </ProtectedRoute>
  ),
},
{
  path: "posts/my/create",
  element: (
    <ProtectedRoute>
      {withSuspense(CreatePostPage)}
    </ProtectedRoute>
  ),
},
{
  path: "/writer",
  element: (
    <RoleRoute roles={["WRITER", "ADMIN"]}>
      <WriterPostPage />
    </RoleRoute>
  ),
},
      {
        path: "writer/*",
        element: (
          <RoleRoute roles={[ROLES.WRITER, ROLES.ADMIN]}>
            <div className="p-8 text-center text-gray-500">
              Writer Dashboard coming soon
            </div>
          </RoleRoute>
        ),
      },

      { path: "*", element: withSuspense(NotFoundPage) },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}