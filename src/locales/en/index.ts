import { common } from './common'
import { nav } from './nav'
import { header } from './header'
import { login } from './login'
import { setPassword } from './setPassword'
import { orderDetails, ordersPage, dashboardPage } from './ordersPages'
import { usersPage } from './users'
import { productsPage } from './products'
import { restaurantPage } from './restaurant'
import {
  typesPage,
  rolesPage,
  menusPage,
  sectionsPage,
  offersPage,
  couponsPage,
  deliveryLocationsPage,
} from './listPages'
import { createForms } from './createForms'
import { statsPage } from './statsPage'

export const en = {
  common,
  nav,
  header,
  login,
  setPassword,
  orderDetails,
  ordersPage,
  dashboardPage,
  usersPage,
  productsPage,
  restaurantPage,
  typesPage,
  rolesPage,
  menusPage,
  sectionsPage,
  offersPage,
  couponsPage,
  deliveryLocationsPage,
  createForms,
  statsPage,
} as const
