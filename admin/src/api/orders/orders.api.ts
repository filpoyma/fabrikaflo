import api from '../baseApi.ts';
import type { IFlowerOrder, TCreateDirectOrderPayload } from '../../types/order';

export const ordersApi = {
  async list(): Promise<{ data: IFlowerOrder[] }> {
    return api.get('orders').json();
  },
  async get(id: string): Promise<{ data: IFlowerOrder }> {
    return api.get(`orders/${id}`).json();
  },
  async createDirect(data: TCreateDirectOrderPayload): Promise<{ data: IFlowerOrder }> {
    return api.post('orders', { json: data }).json();
  },
  async updateStatus(id: string, status: string): Promise<{ data: IFlowerOrder }> {
    return api.put(`orders/${id}/status`, { json: { status } }).json();
  },
  async uploadPhoto(id: string, file: File): Promise<{ data: IFlowerOrder }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`orders/${id}/photos`, { body: formData }).json();
  },
  async sendApproval(id: string): Promise<{ success: boolean; status: string }> {
    return api.post(`orders/${id}/send-approval`).json();
  },
  async sendPayment(id: string, paymentLink: string): Promise<{ success: boolean; status: string }> {
    return api
      .post(`orders/${id}/send-payment`, { json: { paymentLink } })
      .json();
  },
  async assignCourier(id: string, courierId: string): Promise<{ success: boolean; status: string }> {
    return api
      .post(`orders/${id}/assign-courier`, { json: { courierId } })
      .json();
  },
};
