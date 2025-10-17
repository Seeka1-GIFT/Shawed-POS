import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { asyncHandler } from '../middleware/errorHandler';

// Get all purchase orders
export const getPurchaseOrders = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📦 Getting purchase orders...');
    
    const { page = '1', limit = '10', supplierId, status, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    
    if (supplierId) {
      where.supplierId = supplierId as string;
    }
    
    if (status) {
      where.status = status as string;
    }
    
    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: { orderDate: 'desc' }
    });

    const total = await prisma.purchaseOrder.count({ where });

    console.log(`✅ getPurchaseOrders successful: ${purchaseOrders.length} purchase orders found`);
    
    // Convert Decimal fields to numbers
    const processedOrders = purchaseOrders.map(order => ({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    }));
    
    res.json({
      success: true,
      count: purchaseOrders.length,
      total,
      page: pageNum,
      limit: limitNum,
      data: processedOrders
    });
  } catch (error) {
    console.error('❌ getPurchaseOrders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// Get single purchase order
export const getPurchaseOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                buyPrice: true,
                sellPrice: true
              }
            }
          }
        }
      }
    });

    if (!purchaseOrder) {
      res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
      return;
    }

    // Convert Decimal fields to numbers
    const processedOrder = {
      ...purchaseOrder,
      totalAmount: Number(purchaseOrder.totalAmount),
      items: purchaseOrder.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }))
    };

    res.json({
      success: true,
      data: processedOrder
    });
  } catch (error) {
    console.error('❌ getPurchaseOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
});

// Create purchase order
export const createPurchaseOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('📦 Creating purchase order...');
    console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
    
    let {
      supplierId,
      items,
      totalAmount,
      orderDate,
      expectedDate,
      status = 'pending',
      notes
    } = req.body;

    // Handle cases where body was sent as x-www-form-urlencoded
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error('❌ Failed to parse items JSON string:', items);
        return res.status(400).json({ success: false, message: 'Invalid items payload' });
      }
    }
    if (typeof totalAmount === 'string') {
      totalAmount = parseFloat(totalAmount);
    }

    // Validate required fields
    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Supplier ID and items are required'
      });
      return;
    }

    // Generate unique ID
    const orderId = `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create purchase order with items in transaction
    const purchaseOrder = await prisma.$transaction(async (tx) => {
      // Create purchase order
      const newOrder = await tx.purchaseOrder.create({
        data: {
          id: orderId,
          supplierId,
          totalAmount: parseFloat(totalAmount),
          orderDate: orderDate ? new Date(orderDate) : new Date(),
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          status,
          notes
        }
      });

      // Create purchase order items
      const orderItems = await Promise.all(
        items.map((item: any) => 
          tx.purchaseOrderItem.create({
            data: {
              purchaseOrderId: orderId,
              productId: item.productId,
              quantity: parseInt(item.quantity),
              unitPrice: parseFloat(item.unitPrice),
              totalPrice: parseFloat(item.unitPrice) * parseInt(item.quantity)
            }
          })
        )
      );

      return { ...newOrder, items: orderItems };
    });

    console.log('✅ Purchase order created successfully:', purchaseOrder.id);
    
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('❌ createPurchaseOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
});

// Update purchase order
export const updatePurchaseOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;

    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...updateData,
        totalAmount: updateData.totalAmount ? parseFloat(updateData.totalAmount) : undefined,
        orderDate: updateData.orderDate ? new Date(updateData.orderDate) : undefined,
        expectedDate: updateData.expectedDate ? new Date(updateData.expectedDate) : undefined,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('❌ updatePurchaseOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
});

// Delete purchase order
export const deletePurchaseOrder = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.purchaseOrder.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('❌ deletePurchaseOrder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete purchase order',
      error: error.message
    });
  }
});

// Get purchase order statistics
export const getPurchaseOrderStats = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    
    const where: any = {};
    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalValue
    ] = await Promise.all([
      prisma.purchaseOrder.count({ where }),
      prisma.purchaseOrder.count({ where: { ...where, status: 'pending' } }),
      prisma.purchaseOrder.count({ where: { ...where, status: 'completed' } }),
      prisma.purchaseOrder.aggregate({
        where,
        _sum: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalValue: Number(totalValue._sum.totalAmount || 0)
      }
    });
  } catch (error) {
    console.error('❌ getPurchaseOrderStats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order statistics',
      error: error.message
    });
  }
});
