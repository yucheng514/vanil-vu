import "./style.css";

// import Vue from "./vue"
import { Vue } from "./vue";



var MyComponent = Vue.extend({
    template: "<div>A custom component!</div>",
});
// 注册
Vue.component("my-component", MyComponent);
// debugger
var app = new Vue({
    el: "#app",
    data: {
        message: "Hello Vue!",
    },
    methods: {
        click(event) {
            console.log(typeof event); // object
        },
    },
    created() {
        console.log("dd");
    },
});
