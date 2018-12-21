### props
- 不支持对象

### methods
- 不支持对象参数

### computed
- 需要以方法的形式调用 xxx()
其功能和methods一样

### watch
- 无法访问旧值

### 生命周期钩子
+ beforeCreate
+ mounted
+ updated

### 组件
- 无法实例化多次  需要多次实例化可改变组件名称
- 不支持 v-if
- 不支持 v-for
- 不支持 v-model
- 不支持 slot

### mixins
- 不可与现有属性和方法同名

### 指令
- v-text
- v-html
- v-else
- v-else-if
- v-pre
- v-cloak
- v-once

### key 带来的相同类型元素再利用的bug
- 目前无法实现 还是会存在 列表repaint后DOM混乱的问题