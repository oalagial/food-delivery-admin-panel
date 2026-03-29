import { common } from './common'
import { nav } from './nav'
import { header } from './header'
import { login } from './login'
import { setPassword } from './setPassword'
import { forgotPassword } from './forgotPassword'
import { resetPassword } from './resetPassword'
import { orderDetails, ordersPage, dashboardPage } from './ordersPages'
import { usersPage } from './users'
import { productsPage } from './products'
import { restaurantPage } from './restaurant'
import {
  typesPage,
  rolesPage,
  permissionsPage,
  menusPage,
  sectionsPage,
  offersPage,
  couponsPage,
  deliveryLocationsPage,
} from './listPages'
import { createForms } from './createForms'
import { statsPage } from './statsPage'

export const it = {
  common,
  nav,
  header,
  login,
  setPassword,
  forgotPassword,
  resetPassword,
  orderDetails,
  ordersPage,
  dashboardPage,
  usersPage,
  productsPage,
  restaurantPage,
  typesPage,
  rolesPage,
  permissionsPage,
  menusPage,
  sectionsPage,
  offersPage,
  couponsPage,
  deliveryLocationsPage,
  createForms,
  statsPage,
} as const
