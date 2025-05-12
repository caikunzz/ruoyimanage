import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    redirect: "",
    component: () => import("../views"),
    children: [{
      path: '',
      component: () => import('../views/visualEarth'),
      hidden: true
    }]
  }, {
    path: '/login',
    component: () => import('@/views/login'),
    hidden: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 防止连续点击多次路由报错
let routerPush = VueRouter.prototype.push;
let routerReplace = VueRouter.prototype.replace;
// push
VueRouter.prototype.push = function push(location) {
  return routerPush.call(this, location).catch(err => err)
}
// replace
VueRouter.prototype.replace = function push(location) {
  return routerReplace.call(this, location).catch(err => err)
}

router.beforeEach((to, from, next) => {
  //  设置路由白名单
  const whiteList = ["/login"]
  const username = localStorage.getItem("username")
  const password = localStorage.getItem("password")
  const token = localStorage.getItem("token")
  if (whiteList.indexOf(to.path)===-1){
    if ((username&&username!=="") && (password&&password!=="") && (token&&token!=="")){
      next()
    } else{
      router.push("/login").catch(()=>{});
    }
  }else{
    next()
  }
})

export default router
