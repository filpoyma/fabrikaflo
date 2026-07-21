import { API_URL } from './baseApi.ts'
import { setInitData } from './telegramSession.ts'
import { authApi } from './auth/auth.api.ts'
import { galleryApi } from './gallery/gallery.api.ts'
import { ordersApi } from './orders/orders.api.ts'
import { requestsApi } from './requests/requests.api.ts'
import { clientsApi } from './clients/clients.api.ts'
import { cartApi } from './cart/cart.api.ts'
import { adminApi } from './admin/admin.api.ts'
import { aiApi } from './ai/ai.api.ts'

/** @deprecated Use feature modules and TanStack Query hooks instead. */
export const api = {
  API_BASE: API_URL,

  login: authApi.login,
  getMe: authApi.getMe,
  loginWithTelegramWidget: authApi.loginWithTelegramWidget,

  getProducts: galleryApi.list,
  getProduct: galleryApi.getById,
  getCategories: galleryApi.getCategories,

  createRequest: requestsApi.create,
  uploadRequestPhoto: requestsApi.uploadPhoto,

  getOrders: ordersApi.listMy,
  getOrder: ordersApi.getMy,
  approveOrder: ordersApi.approve,
  disapproveOrder: ordersApi.disapprove,
  uploadReceipt: ordersApi.uploadReceipt,
  repeatOrder: ordersApi.repeat,

  getProfile: clientsApi.getProfile,
  updateProfile: clientsApi.updateProfile,
  uploadAvatar: clientsApi.uploadAvatar,

  getCart: cartApi.get,
  addToCart: cartApi.add,
  removeFromCart: cartApi.remove,
  updateCartItemQty: cartApi.updateQty,

  getArticle: () => Promise.reject(new Error('Articles endpoint not implemented on backend')),
  adminUpdateArticle: () => Promise.reject(new Error('Not implemented')),
  adminDeleteArticle: () => Promise.reject(new Error('Not implemented')),

  adminGetOrders: adminApi.getOrders,
  adminUpdateOrder: adminApi.updateOrder,
  adminGetRequests: adminApi.getRequests,
  adminConvertRequest: adminApi.convertRequest,
  adminUploadImage: adminApi.uploadImage,
  adminCreateProduct: adminApi.createProduct,
  adminUpdateProduct: adminApi.updateProduct,
  adminDeleteProduct: adminApi.deleteProduct,
  adminToggleProduct: adminApi.toggleProduct,
  adminGetProducts: adminApi.getProducts,
  adminUpdateProductStock: adminApi.updateProductStock,
  adminCreateCategory: adminApi.createCategory,
  adminDeleteCategory: adminApi.deleteCategory,
  adminAddTeamMember: adminApi.addTeamMember,
  adminDeleteTeamMember: adminApi.deleteTeamMember,
  adminGetTeamMembers: adminApi.getTeamMembers,
  adminGetAuditLogs: adminApi.getAuditLogs,
  adminGetSettings: adminApi.getSettings,
  adminUpdateSettings: adminApi.updateSettings,
  adminGetStats: adminApi.getStats,
  adminGetReferrals: adminApi.getReferrals,
  adminGetUserReferral: adminApi.getUserReferral,
  adminSetDiscount: adminApi.setDiscount,
  adminSetPartner: adminApi.setPartner,

  sendAiChatText: aiApi.sendChatText,
  sendAiVoiceFile: aiApi.sendVoiceFile,
}

export { setInitData, API_URL }
export * from './auth/index.ts'
export * from './gallery/index.ts'
export * from './orders/index.ts'
export * from './requests/index.ts'
export * from './clients/index.ts'
export * from './cart/index.ts'
export * from './admin/index.ts'
export * from './ai/index.ts'
export * from './queryClient.ts'
export * from './queryUtils.ts'
