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
 *  [state_ready]:Boolean //初始是否就绪，不需要调用fetchState default false
 *  [getters_return_isfunction]:Boolean // 默认getters的类型
 *  [getInitalState]:Function //获取初始值
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
            throw new Error(`Vuex-easy 初始化失败，${name} 未配置state`)
        }
        //声明state
        states[name] = st.state;
        //声明actions
        if (st.actions) {
            actions[name] = st.actions;
        }
        var getterfn = st.getters;

        if (!st.fetchState) {
            //非异步，简化声明
            //声明mutations
            mutations[name] = st.mutations ? st.mutations : (state, nval) => {
                state[name] = nval;
            }
            //声明getters
            getters[name] = getterfn ? getterfn : (state) => state[name];
        } else {
            //异步
            //TODO 更多的类型？
            var isObject = Object.prototype.toString.call(st.state) === '[object Object]',
                getInitalState = st.getInitalState || (isObject ? () => {
                    return {}
                } : () => []); //用来判断数据是否被初始化
            var COMMIT_BEGIN = "COMMIT_BEGIN",
                COMMIT_END = "COMMIT_END",
                COMMIT_ING = "COMMIT_ING",
                GUID_EMPTY = '00000000-0000-0000-0000-000000000000',
                status = {
                    commit: COMMIT_END, //记录状态
                };
            //state ready?
            if (!st.state_ready) {
                states[name] = getInitalState();
                status.commit = COMMIT_BEGIN;
            }

            //植入怪异方式重置state
            mutations[name] = function (state, nval) {
                //赋值操作 触发getters
                if (nval) {
                    if (st.mutations) {
                        st.mutations.apply(this, arguments);
                    } else {
                        state[name] = nval;
                    }
                } else {
                    //重置 一次commit 对应一次getters
                    status.commit = COMMIT_BEGIN;
                    //TODO 调用st.mutations?
                    state[name] = getInitalState();//触发getters
                    //commit end'=
                    Object.keys(status).forEach(prop => {
                        status[prop] = COMMIT_END;
                    });
                }
            }
        };

        //getters 实现按需加载
        //非函数，
        if (!st.getters_return_isfunction) {
            getters[name] = function (state) {
                if (status.commit === COMMIT_BEGIN) {
                    status.commit =COMMIT_ING;
                    st.fetchState().then(data => {
                        store.commit(name, data);
                    })
                }
                return getterfn ? getterfn.apply(this, arguments) : state[name];
            }
        } else {
            // 函数：1过滤函数，2请求参数
            getters[name] = function (state) {
                //拦截参数
                return function () {
                    return (arg) => {
                        if (status.commit === COMMIT_BEGIN) {
                            //本次getters的唯一标识
                            var guid = typeof arg === 'undefined' ? GUID_EMPTY :
                                typeof arg === 'string' ? arg : arg.vuex_easy_id;
                            var gstatus = status[guid];
                            if (!gstatus) {
                                gstatus = status[guid] = {
                                    commit: COMMIT_BEGIN
                                }
                            } else if (gstatus.commit === COMMIT_END) {
                                gstatus.commit = COMMIT_BEGIN;
                            }
                            if (gstatus.commit === COMMIT_BEGIN) { //一次commit+一个arg 对应一次fetch
                                gstatus.commit = COMMIT_ING;
                                st.fetchState(arg).then(data => {
                                    //data内注入 参数信息，自定义mutations 实现参数对应数据的存储
                                    store.commit(name, data);
                                })
                            }
                        }
                        //箭头函数
                        return getterfn ? getterfn.apply(this, arguments) : state[name];
                    }
                }
            }
        }
    });
    return store = new Vuex.Store({
        state: states,
        getters,
        mutations,
        actions
    })
}

// function guid() {
//     // https://blog.csdn.net/qq_37568049/article/details/80736305 
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
//         var r = Math.random() * 16 | 0,
//             v = c == 'x' ? r : (r & 0x3 | 0x8);
//         return v.toString(16);
//     });
// }