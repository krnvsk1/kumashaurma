import React from 'react'
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button,
  Box 
} from '@mui/material'
import { 
  Restaurant as RestaurantIcon,
  LocalShipping as DeliveryIcon,
  AttachMoney as MoneyIcon 
} from '@mui/icons-material'

function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Панель управления Kumashaurma
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Управляйте вашим бизнесом шаурмы
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <RestaurantIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" component="div">
                Всего заказов
              </Typography>
              <Typography variant="h3" color="primary">
                156
              </Typography>
              <Typography variant="body2" color="text.secondary">
                За последний месяц
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/orders">
                Просмотреть все
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <DeliveryIcon color="secondary" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" component="div">
                Активные доставки
              </Typography>
              <Typography variant="h3" color="secondary">
                8
              </Typography>
              <Typography variant="body2" color="text.secondary">
                В процессе доставки
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" href="/orders">
                Отследить
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <MoneyIcon color="success" sx={{ fontSize: 40, mb: 2 }} />
              <Typography variant="h6" component="div">
                Выручка
              </Typography>
              <Typography variant="h3" color="success.main">
                245,800 ₽
              </Typography>
              <Typography variant="body2" color="text.secondary">
                За текущий месяц
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">
                Подробнее
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Быстрые действия
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" href="/create">
              Создать новый заказ
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined">
              Посмотреть меню
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined">
              Управление ингредиентами
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  )
}

export default DashboardPage
