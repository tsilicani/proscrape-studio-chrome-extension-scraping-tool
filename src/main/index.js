import Vue from 'vue'
import App from './Index.vue'

import Vuetify from "vuetify";

Vue.use(Vuetify);

import AsyncComputed from 'vue-async-computed'

Vue.use(AsyncComputed)

new Vue({
    el: '#app',
    vuetify: new Vuetify({
        theme: {
            dark: true,
            themes: {
                dark: {
                    primary: '#47828c',
                },
            }
        }
    }),
    render: h => h(App)
});