# Vuex-easy

Vuex生产者，简化Vuex的配置和使用。

## 简化原因 
* 每添加一个仓储都需要声明`state`、`mutations`。`mutations`里的逻辑基本都是赋值操作，代码重复；
* 个人觉得`dispatch`很难理解，仓储主要功能在是存储，用`dispatch`做异步的数据拉取；


官方取数据可以用state、getter，简化为只用getter（sync，async）；官方提交修改用action和mutation，简化为只用mutation