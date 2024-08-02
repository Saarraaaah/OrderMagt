import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

const WaiterOrderManagement = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch initial orders
    fetchOrders();

    // Listen for new orders
    socket.on('newOrder', newOrder => {
      setOrders(prevOrders => [...prevOrders, newOrder]);
    });

    // Listen for order updates
    socket.on('orderUpdated', updatedOrder => {
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    return () => {
      socket.off('newOrder');
      socket.off('orderUpdated');
    };
  }, []);

  const fetchOrders = () => {
    axios.get(`${API_URL}/orders`)
      .then(response => setOrders(response.data))
      .catch(error => console.error('Error fetching orders:', error));
  };

  const updateOrderStatus = (orderId, newStatus) => {
    axios.patch(`${API_URL}/orders/${orderId}`, { status: newStatus })
      .then(response => {
        setOrders(orders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      })
      .catch(error => console.error('Error updating order status:', error));
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Waiter Order Management</h1>
      
      {orders.map(order => (
        <Card key={order.id} className="mb-4">
          <CardHeader>Order for Table {order.tableNumber}</CardHeader>
          <CardContent>
            {order.items.map((item, index) => (
              <div key={index} className="mb-1">
                {item.name} - ${item.price}
              </div>
            ))}
            <div className="font-bold mt-2">
              Total: ${order.total}
            </div>
            <div className="mt-2">Status: {order.status}</div>
          </CardContent>
          <CardFooter>
            {order.status === 'new' && (
              <Button onClick={() => updateOrderStatus(order.id, 'preparing')} className="mr-2">
                Start Preparing
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button onClick={() => updateOrderStatus(order.id, 'ready')} className="mr-2">
                Mark as Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button onClick={() => updateOrderStatus(order.id, 'delivered')} className="mr-2">
                Mark as Delivered
              </Button>
            )}
            <Button variant="destructive" onClick={() => updateOrderStatus(order.id, 'cancelled')}>
              Cancel Order
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default WaiterOrderManagement;
