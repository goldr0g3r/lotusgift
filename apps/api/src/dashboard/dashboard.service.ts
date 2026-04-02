import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalProducts, totalClients, totalQuotes, totalOrders, pendingQuotes, pendingOrders, recentQuotes, recentOrders, totalRevenue, newInquiries] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.client.count(),
      this.prisma.quote.count(),
      this.prisma.order.count(),
      this.prisma.quote.count({ where: { status: 'DRAFT' } }),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.quote.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { client: true, items: { include: { product: true } } } }),
      this.prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, items: { include: { product: true } } } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
      this.prisma.contactInquiry.count({ where: { status: 'NEW' } }),
    ]);

    return {
      totalProducts,
      totalClients,
      totalQuotes,
      totalOrders,
      pendingQuotes,
      pendingOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      newInquiries,
      recentQuotes,
      recentOrders,
    };
  }
}
