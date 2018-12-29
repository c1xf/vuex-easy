//@ts-check
//Vuex：https://vuex.vuejs.org/zh/
/**
 * @example
 * {
 * name:{
 *  state:Array|Object // 初始数据 必须有
 *  [getters]:Function
 *  [mutations]:Function
 *  [actions]:Function
 *  [fetchState]:Function //获取数据的方法
 *  [getters_default_type]:String // 默认getters的类型
 *  [getInitval]:Function //获取初始值
 * }
 * }
 * @param {Object} conf 仓储配置对象
 * @returns {Object} 返回Vuex的官方配置
 */
function factory(conf) {

    const states = {},
        getters = {},
        actions = {},
        mutations = {};

    // const slice = Function.prototype.call.bind(Array.prototype.slice);

    var store;
    Object.keys(conf).forEach(name => {
        const st = conf[name];
        if (!st.state) {
            throw new Error(`Vuex-easy 初始化失败，${name} 未配置state。无数据请传入[]/{}`)
        }
        //声明state
        states[name] = st.state;
        //声明actions
        if (st.actions) {
            actions[name] = st.actions;
        }
        var getterfn = st.getters;

        if (!st.fetchState) {
            //非异步

            //声明mutations
            mutations[name] = st.mutations ? st.mutations : (state, nval) => {
                state[name] = nval;
            }
            //声明getters
            getters[name] = getterfn ? getterfn : (state) => state[name];
        } else {
            //异步
            var isObject = Object.prototype.toString.call(st.state) === '[object Object]',
                getInitval = st.getInitval || (isObject ? () => {
                    return {}
                } : () => []),
                initVal; //用来判断数据是否被初始化
            //初始值
            if (JSON.stringify(st.state) === (isObject ? '{}' : '[]')) {
                states[name] = initVal == getInitval();
            } else {
                states[name] = st.state;
            }
            var status = {
                commitCount: 0, //记录状态
                loading: false
            };
            mutations[name] = function (state, nval) {
                //赋值操作 触发getters
                if (nval) {
                    if (st.mutations) {
                        st.mutations.apply(this, arguments);
                    } else {
                        state[name] = nval;
                    }
                } else {
                    //重置
                    status.commitCount++;
                    //TODO 未调用mutations
                    state[name] = initVal = getInitval();
                }
            };
            if (!getterfn) {
                if(st.getters_default_type === 'function'){
                    getters[name] = function (state) {
                        return function(arg){
                            var guid = typeof arg === 'undefined' ? empty_guid() : guid();
                            if (!status[guid]) {
                                status[guid] = {
                                    commitCount: status.commitCount
                                }
                            }
                        }
                    }
                }else{
                    //不需要传递参数
                    getters[name] = function (state) {
                        if (status.commitCount) { //避免重复调用API
                            status.commitCount--
                            st.fetchState().then(data => {
                                store.commit(name, data);
                            })
                        }
                        return state[name];
                    };
                }
            } else {
                // 尝试调用getterfn，根据返回值 ，判断是否要取值
                var getters_return_type;
                try {
                    getters_return_type = getterfn(getInitval());
                } catch (error) {
                    console.error(error)
                    throw new Error(`vuex-easy初始化失败，${name}.getters() 执行失败，类型检测失败。`)
                }
                if (typeof getters_return_type === 'function') {
                    //实现参数的截取fetchState
                    getters[name] = function () {
                        return (arg) => {
                            //本次getters的唯一标识
                            var guid = typeof arg === 'undefined' ? empty_guid() : guid();
                            if (!status[guid]) {
                                status[guid] = {
                                    commitCount: status.commitCount
                                }
                            }
                            if (!status[guid].commitCount) { //一次commit+一个arg 对应一次fetch
                                status[guid].commitCount--;
                                st.fetchState(guid).then(data => {
                                    //data内注入 参数信息，自定义mutations 实现参数对应数据的存储
                                    store.commit(name, data);
                                    delete status[guid];

                                })
                            }
                            return getterfn.apply(this, arguments)
                        }
                    }

                } else {
                    getters[name] = function (state) {
                        if (state[name] === initVal) {
                            if (!status.loading) { // 避免重复请求
                                status.status.loading = true;
                                st.fetchState().then(data => {
                                    status.status.loading = false;
                                    store.commit(name, data);
                                })
                            }
                        }
                        return getterfn.apply(this, arguments)
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

function guid() {
    // https://blog.csdn.net/qq_37568049/article/details/80736305 
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function empty_guid() {
    return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'.replace('x', '0')
}
export default factory;