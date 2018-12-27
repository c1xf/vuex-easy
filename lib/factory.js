/**
 * @example
 * {
 * name:{
 *  state:Array|Object, // 初始数据
 *  [async]:Boolean, // 是否异步
 *  [geterrs]:Function //获取时调用的方法，async模式必须传
 *  [mutations]:Function //提交时调用的方法
 *  [gettersIsFn]:Boolean //getters 调用的时候是否是函数
 * }
 * }
 * @param {Ohject} conf 仓储配置对象
 * @returns {Object} 返回Vuex的官方配置
 */
function initStore(conf) {

    var states = {},
        getters = {},
        mutations = {};

    var store,
        status = {};

    const slice = Function.prototype.call.bind(Array.prototype.slice);

    Object.keys(conf).forEach(name => {
        var st = conf[name];
        //声明state
        states[name] = st.state;
        //声明mutations
        mutations[name] = (state, nval) => {
            //是否配置 mutations
            state[name] = st.mutations ? st.mutations(nval) : nval;
        }

        //数据获取
        var getterfn = st.getters;
        //同步
        if (!st.async) {
            if (!getterfn) {
                getters[name] = (state) => state[name]
            } else {
                //getters 进行过滤
                getters[name] = () => {
                    var args = slice(arguments);
                    var state = args.shift();
                    return getterfn(state[name], args[0])
                }
            }
            return;
        } else {
            //异步
            var isObject = Object.prototype.toString.call(st.state) === '[object Object]',
                getInitval = isObject ? () => {} : () => [],
                middleName = name + '_middle',
                initVal = getInitval(),
                commitCount = 0,
                lastCommitCount;

            //初始化中间存储
            if (JSON.stringify(st.state) === (isObject?'{}':'[]')) {
                states[middleName] = initVal
            } else {
                states[middleName] = st.state;
            }

            //默认mutatiosn，变成重置中间存储对象的数据
            mutations[name] = (state) => {
                commitCount++
                state[middleName] = initVal = getInitval();
            };

            //中间存储commit
            mutations[middleName] = (state, nval) => {
                var prop;
                if (prop = nval._prop) {
                    // 只改变指定的属性
                    delete nval._prop;
                    state[middleName][prop] = nval;
                } else {
                    state[middleName] = nval;
                }
            }
            if (!st.gettersIsFn) {
                getters[name] = function () {
                    var args = slice(arguments);
                    var state = args.shift();
                    //未初始化，promise pending
                    if (state[middleName] === initVal && !status[name]) {
                        status[name] = st.async(args[0]);
                        status[name].then(data => {
                            //
                            store.commit(middleName, {
                                data
                            });
                            status[name] = null;
                        })
                    }
                    return state[middleName];
                }
            } else {
                getters[name] = function () {
                    var state = slice(arguments)[0];

                    return function () {
                        var args = slice(arguments);
                        var hasKey = args.length > 0 && typeof args[0] === 'string';

                        //创建唯一键
                        var kkey = hasKey ? (args.shift() + name) : name;

                        //未初始化 还在初始值
                        if (state[middleName] === initVal || (hasKey && !state[middleName][kkey])) {
                            if (lastCommitCount !== commitCount) {
                                lastCommitCount = commitCount;
                                //取消上一个同步
                                status[kkey] && status[kkey].cancel();
                                //检查是否有cancel
                                var asyncPromise = st.async.apply(null, args);

                                var resolve,
                                    promise = new Promise(res => resolve = res);
                                asyncPromise.then(data => {
                                    if (!promise.isCancel) {
                                        resolve(data)
                                    }
                                });
                                promise.cancel = () => {
                                    asyncPromise.cancel && asyncPromise.cancel();
                                    promise.isCancel = true
                                }
                                status[kkey] = promise;

                                status[kkey].then(data => {
                                    store.commit(middleName, {
                                        kkey: hasKey ? kkey : '',
                                        data
                                    });
                                    status[kkey] = null;
                                })
                            }
                        }
                        if (hasKey && !state[middleName][kkey]) {
                            Vue.set(state[middleName], kkey, [])
                        }
                        var filter = args[1],
                            val = hasKey ? state[middleName][kkey] : state[middleName];
                        return filter ? filter(val) : val;
                    }
                }
            }
        }

    });
    return store = new Vuex.Store({
        state: states,
        getters,
        mutations
    })
}

export default initStore;