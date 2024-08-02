import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:3001/api';
const socket = io('http://localhost:3001');

const CustomerOrderPlacement = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [order, setOrder] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Fetch menu items from the API
    axios.get(`${API_URL}/menu`)
      .then(response => setMenuItems(response.data))
      .catch(error => console.error('Error fetching menu:', error));

    // Listen for 'orderReady' events
    socket.on('orderReady', (readyOrder) => {
      if (readyOrder.tableNumber === tableNumber) {
        setNotification(`Your order for table ${readyOrder.tableNumber} is ready!`);
      }
    });

    return () => {
      socket.off('orderReady');
    };
  }, [tableNumber]);

  const addToOrder = (item) => {
    setOrder([...order, item]);
  };

  const removeFromOrder = (index) => {
    setOrder(order.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return order.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  const placeOrder = () => {
    const orderData = {
      tableNumber,
      items: order,
      total: calculateTotal()
    };

    axios.post(`${API_URL}/orders`, orderData)
      .then(response => {
        alert('Order placed successfully!');
        setOrder([]);
        setTableNumber('');
      })
      .catch(error => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      });
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Place Your Order</h1>
      
      {notification && (
        <Alert className="mb-4">
          <AlertTitle>Order Ready!</AlertTitle>
          <AlertDescription>{notification}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-4">
        <CardHeader>Menu</CardHeader>
        <CardContent>
          {menuItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center mb-2">
              <span>{item.name} - ${item.price}</span>
              <Button onClick={() => addToOrder(item)}>Add</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>Your Order</CardHeader>
        <CardContent>
          {order.map((item, index) => (
            <div key={index} className="flex justify-between items-center mb-2">
              <span>{item.name} - ${item.price}</span>
              <Button variant="destructive" onClick={() => removeFromOrder(index)}>Remove</Button>
            </div>
          ))}
          <div className="font-bold mt-2">Total: ${calculateTotal()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Place Order</CardHeader>
        <CardContent>
          <Input
            type="text"
            placeholder="Table Number"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            className="mb-2"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={placeOrder} disabled={order.length === 0 || !tableNumber}>
            Place Order
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CustomerOrderPlacement;
