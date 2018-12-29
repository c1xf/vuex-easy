# Vuex-easy(开发测试中)（个人项目，自己维护，仅限学习交流）

☕抱着`Vuex`大腿，简化`Vuex`的配置和使用，利用`getters`特性实现**按需调用API加载数据**，适合SPA后台管理系统。

## 功能
* 按需加载数据
* 简化声明方式
* 简化使用方式
* 还是原汁原味的Vuex，只是在使用层封装

## 示意图

在尤大的图上改了改

![](http://ww1.sinaimg.cn/large/e3ba9e6dgy1fynfnsaekrj20jh0fbaae.jpg)

## 🔥按需加载数据

SPA后台管理系统通常会有一个字典表，给客户自定义一些字段；这类数据往往是全局的，`Vuex`完美解决这类全局共享的问题；

但是按照官方的demo，数据在使用前就将`state`初始化好，字典数据多而杂，初始化时加载，很可能请求用不着的数据，造成浪费，对于需要查询某一特定配置下的数据，也就更麻烦了。

`Vuex-easy`提供`fetchState`配置获取数据的`promise`。通过改造封装`getters`实现使用`getters.xxx` 就能按需加载数据，使用`getters.xxx(arg)`，来加载特定的数据。

## 简化声明方式

一般情况下的仓储mutations都比较简单，`mutations`内都是赋值操作`state.xxx = nval`；`vuex-easy`默认创建好。

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

没有选择困难症😁

### 抛弃actions

`actions` 的原则是在请求完之后`commit`新数据，不是完全的按需加载。
`vuex-easy` 不建议用`actions`来`dispatch`，只会用一个比较怪异但简单的方式 `this.$store.commit('todos')`通过不传入`nval`来重置`state`。数据是否需要获取由当前实例中是否有相应的`getters`控制，这样符合按需加载的要求。`vuex-easy`暂不支持`actions`，若有实际场景再另行斟酌。

## 原汁原味的Vuex

`Vuex-easy`是一个`Vuex`的生产者，只是根据场景对`Vuex`的应用做了些调整
```
...
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

欢迎提`Issues`交流。

## 附

1. Vuex中文官网：[https://vuex.vuejs.org/zh/](https://vuex.vuejs.org/zh/)