//@ts-check
/**
 * @example
 * {
 * name:{
 *  state:Array|Object // 初始数据 必须有
 *  [getters]:Function
 *  [mutations]:Function
 *  [getData]:Function //获取数据的方法
 * }
 * }
 * @param {Object} conf 仓储配置对象
 * @returns {Object} 返回Vuex的官方配置
 */
function factory(conf) {

    const states = {},
        getters = {},
        mutations = {};

    const slice = Function.prototype.call.bind(Array.prototype.slice);
    var store;
    Object.keys(conf).forEach(name => {
        const st = conf[name];
        if (!st.state) {
            throw new Error(`Vuex-easy 初始化失败，${name} 未配置state。无数据请传入[]/{}`)
        }
        //声明state
        states[name] = st.state;
        var getterfn = st.getters;

        if (!st.getData) {
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
                getInitval = isObject ? () => {
                    return {}
                } : () => [],
                initVal = getInitval(); //用来判断数据是否被初始化
            //初始值
            if (JSON.stringify(st.state) === (isObject ? '{}' : '[]')) {
                states[name] = initVal
            } else {
                states[name] = st.state;
            }

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
                    state[name] = initVal = getInitval();
                }
            };

            getters[name] = function () {
                var args = slice(arguments);
                var state = args.shift();
                if (state[name] === initVal) {
                    var cur = {
                        promise: st.getData(state[name]),
                        data: initVal
                    }
                    cur.promise.then(data => {
                        // 保证是最后一次，才进行赋值
                        if (cur.data === initVal) {
                            store.commit(name, data);
                        }
                    })
                }
                return getterfn(state);
            };
        }

    });
    return store = new Vuex.Store({
        state: states,
        getters,
        mutations
    })
}

export default factory;