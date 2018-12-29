# Vuex-easy（仅限学习交流）

☕简化Vuex的配置和使用，实现按需调用API，适合SPA后台管理系统。

## 用途
* 按需加载数据
* 简化声明方式
* 简化使用方式
* 还是原汁原味的Vuex，只是在使用层封装

## 示意图

在尤大的图上改了改

![](http://ww1.sinaimg.cn/large/e3ba9e6dgy1fynfnsaekrj20jh0fbaae.jpg)

## 🔥按需加载数据

SPA系统通常会有一个字典表，给客户自定义；这类数据往往是全局的，Vuex完美解决这类全局共享的问题；但是数据必须初始化好，字典数据多，如果不按需加载，站点启动时就需要请求大量的数据，这，不能忍啊。

`Vuex-easy`提供`fetchState`配置获取数据的`promise`。通过改造封装`getters`实现使用`getters.xxx` 就能按需加载数据。另外`getters`还是原汁原味。

## 简化声明方式

一般情况下的仓储都比较简单，`mutations`内都是赋值操作`state.xxx = nval`；`vuex-easy`默认创建好。另外默认被声明的还有`getters`

```
vuexEasy({
    todos:{
        state:[]
    }
})
//this.$store.getters.todos
```

## 简化使用方式

在简化使用方式时，`vuex-easy`会默认创建`getters`，这样的目的是让使用方式只有两种：

1. `this.$store.getters.todos`
2. `this.$store.commit('todos',nval)`
3. `this.$store.commit('todos')` //重置代替`dispatch`

没有选择困难症😁

### 抛弃actions

`actions` 的原则是在请求完之后`commit`新数据，在实际应用时，每次修改字典都必须去调用API，拉取新的数据。
`vuex-easy` 不建议用`actions`来`dispatch`，只会用一个比较怪异的方式 `this.$store.commit('todos')`来重置`state`。数据是否需要获取由当前实例中是否有相应的`getters`控制，这样符合按需加载的要求。`vuex-easy`暂不支持`actions`。

## 原汁原味的Vuex

只是一个`Store`的生产者，在实际应用上根据场景对`Vuex`的应用做了些调整
```
    return store = new Vuex.Store({
        state: states,
        getters,
        mutations
    })
```

## 代码示例&demo
```
vuexEasy({
    todos:{
        state:[]
    }
})

```



## 其他

亮点还是在**按需加载**，实现该需求是通过使用`getters`，每次修改`state`都会调用相应的`getters`来实现的。

欢迎提`Issues`交流。

## 附

1. Vuex中文官网：[https://vuex.vuejs.org/zh/](https://vuex.vuejs.org/zh/)