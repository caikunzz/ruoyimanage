self.onmessage = function(e) {
    const { item, index, consumerCode } = e.data;

    // 将 consumer 代码字符串转成函数
    const consumer = new Function("return " + consumerCode)();

    // 执行 consumer 函数
    consumer(item, index)
        .then(result => {
            // 将结果发送回主线程
            self.postMessage({ index, result });
        })
        .catch(error => {
            // 处理错误
            self.postMessage({ index, result: null, error: error });
        });
};
