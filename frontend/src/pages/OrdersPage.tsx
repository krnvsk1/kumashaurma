import React from 'react'
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box
} from '@mui/material'
import { Visibility as ViewIcon, Edit as EditIcon } from '@mui/icons-material'

function OrdersPage() {
  // Тестовые данные
  const orders = [
    { id: 1, customer: 'Иван Иванов', status: 'Выполнен', total: 350, date: '2024-01-15' },
    { id: 2, customer: 'Мария Петрова', status: 'В процессе', total: 450, date: '2024-01-15' },
    { id: 3, customer: 'Алексей Сидоров', status: 'Доставляется', total: 520, date: '2024-01-14' },
    { id: 4, customer: 'Елена Ковалёва', status: 'Новый', total: 280, date: '2024-01-14' },
    { id: 5, customer: 'Дмитрий Новиков', status: 'Выполнен', total: 600, date: '2024-01-13' },
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Выполнен': return 'success'
      case 'В процессе': return 'warning'
      case 'Доставляется': return 'info'
      case 'Новый': return 'primary'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Заказы
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Клиент</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Сумма</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    color={getStatusColor(order.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{order.total} ₽</TableCell>
                <TableCell>
                  <IconButton size="small" title="Просмотреть">
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" title="Редактировать">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Показано {orders.length} заказов
        </Typography>
        <Box>
          <Chip label="Все" color="primary" variant="outlined" sx={{ mr: 1 }} />
          <Chip label="Новые" variant="outlined" sx={{ mr: 1 }} />
          <Chip label="В процессе" variant="outlined" sx={{ mr: 1 }} />
          <Chip label="Выполненные" variant="outlined" />
        </Box>
      </Box>
    </Box>
  )
}

export default OrdersPage
