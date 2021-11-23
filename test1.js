const  axios = require("axios")

async function start() {
    // for(let i = 0; i < 1000; i++) {
        const {data} = await axios.get("https://zdesnachinaetsyarossia.ru/ok/#1")
        console.log(data)
        console.log(i)
    // }
}
start()