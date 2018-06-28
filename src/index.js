var MVVM = require('../libs/MVVM')

new MVVM({
  el: '#app',
  template: require('./template.html'),
  data: {
    name: 'MVVM',
    sex: 'male'
  },
  computed: {
    tips(){
      return this.name + ' is ' + this.sex + ' ' + this.age
    }
  },
  methods: {
    say(){
      this.sex = 'female';
      this.age = 20;
      this.$repaint();
    }
  },
  events: {
    change(e){
      this.say();
    }
  },
  mixins: require('./mixins'),
  beforeCreate(){
    // console.log('beforeCreate');
  },
  beforeMount(){
    // console.log('beforeMount');
  },
  mounted(){
    // console.log('mounted');
  },
  updated(){
    // console.log('updated');
  }
})