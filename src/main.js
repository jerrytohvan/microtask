import '@babel/polyfill' // <- babel Polyfills
import 'whatwg-fetch' // <- Fetch API Polyfill

import Vue from 'vue'

import App from './Components/App/App.vue'

import { VueHammer } from 'vue2-hammer'

import config from './../config'
import { register_service_worker } from './utils'

register_service_worker() // <- register service worker, disable it, when running in development mode

Vue.prototype.config = config // <- set config to global scope

/* (global) This code is going to tell us, if history mode can be activated on the client, so the application can be consumed without localstorage */
Vue.prototype.history = () => {
    try {
        localStorage.getItem('check')
        return true
    }

    catch {
        return false
    }
}

/* (global) Currently selected language or fallback language (en). Needs to be a function, since it's reactive. No need for vuex there */
Vue.prototype.lang = () => {
    if(Vue.prototype.history()) return localStorage.getItem('lang') || config.app.fallback_lang

    else {
        return config.app.fallback_lang
    }
}

Vue.use(VueHammer)

new Vue({
    el: '#app',
    render: h => h(App)
}).$mount('#app')

// change the threshold for all swipe recognizers
VueHammer.config.tap = {
    interval: 500
};
