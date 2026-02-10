import React, { useState } from 'react'
import {
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'

function CreateOrderPage() {
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [orderItems, setOrderItems] = useState<Array<{id: number, name: string, price: number, quantity: number}>>([])

  const menuItems = [
    { id: 1, name: 'Шаурма классическая', price: 250 },
    { id: 2, name: 'Шаурма острая', price: 280 },
    { id: 3, name: 'Шаурма с сыром', price: 320 },
    { id: 4, name: 'Вегетарианская шаурма', price: 220 },
    { id: 5, name: 'Детская шаурма', price: 180 },
  ]

  const handleAddItem = () => {
    if (!selectedItem) return
    
    const item = menuItems.find(i => i.id === parseInt(selectedItem))
    if (item) {
      setOrderItems([...orderItems, { 
        ...item, 
        quantity,
        id: Date.now() // временный ID
      }])
      setSelectedItem('')
      setQuantity(1)
    }
  }

  const handleRemoveItem = (id: number) => {
    setOrderItems(orderItems.filter(item => item.id !== id))
  }

  const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const handleSubmit = () => {
    const orderData = {
      customerName,
      phone,
      address,
      items: orderItems,
      total: totalAmount,
      date: new Date().toISOString()
    }
    console.log('Order data:', orderData)
    alert('Заказ создан! (проверьте консоль)')
    // Здесь будет отправка на бэкенд
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Создание нового заказа
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о клиенте
              </Typography>
              
              <TextField
                fullWidth
                label="Имя клиента"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Телефон"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                fullWidth
                label="Адрес доставки"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Добавить блюдо
              </Typography>
              
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Блюдо</InputLabel>
                    <Select
                      value={selectedItem}
                      label="Блюдо"
                      onChange={(e) => setSelectedItem(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Выберите блюдо</em>
                      </MenuItem>
                      {menuItems.map(item => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name} - {item.price} ₽
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Количество"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddItem}
                    disabled={!selectedItem}
                  >
                    Добавить
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Состав заказа
              </Typography>
              
              {orderItems.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                  Добавьте блюда в заказ
                </Typography>
              ) : (
                <List>
                  {orderItems.map((item, index) => (
                    <React.Fragment key={item.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" onClick={() => handleRemoveItem(item.id)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={item.name}
                          secondary={`${item.quantity} × ${item.price} ₽`}
                        />
                        <Typography>
                          {item.quantity * item.price} ₽
                        </Typography>
                      </ListItem>
                      {index < orderItems.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  Итого:
                </Typography>
                <Typography variant="h5" color="primary">
                  {totalAmount} ₽
                </Typography>
              </Box>
              
              <Button
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                onClick={handleSubmit}
                disabled={orderItems.length === 0 || !customerName || !phone}
              >
                Создать заказ
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CreateOrderPage
