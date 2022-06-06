import dotenv from "dotenv"
dotenv.config()

await new Promise(r => setTimeout(r, 1000))

const strapi = await import("./parser/strapi.js")

const data = await strapi.create("offers", {
    "title": "Без комиссии, рядом метро!",
    "description": "ПИК-Аренда  простой и безопасный способ снять квартиру. Мы проверяем права собственности через Росреестр, заключаем юридически надежный договор и поддерживаем жильцов и собственников на всех этапах аренды.\\n\\nБольшинство наших квартир можно посмотреть без собственника в любое удобное для вас время: вы бронируете время просмотра, забираете ключи из сейфа и спокойно осматриваете квартиру. Всю сделку мы оформляем электронно  это так же безопасно, как бумажный договор, но намного проще и удобнее.\\n\\nПросторная евротрёшка на 26-м этаже монолитного дома, ЖК Аэробус, в развитом районе. Без комиссии! Арендная плата на первые 3 месяца проживания снижена до 150 000 рублей, затем она вновь составит 160 000 рублей. В стоимость аренды включено парковочное место на подземном паркинге. В квартире есть необходимая мебель и техника для комфортного проживания: плита, телевизор, стиральная машина, кондиционер, духовой шкаф, микроволновка. Санузел раздельный. Полы  ламинат и плитка. Интернет проведён, есть Wi-fi. \\n\\nСобственник готов заселить не более 4-х взрослых жильцов, можно с детьми. С домашними животными нельзя.\\n\\nВ районе развитая инфраструктура, в пешей доступности от дома: большое количество учебных заведений, салон красоты и барбершоп, кофейни, сетевые кафе, продуктовые супермаркеты, фитнес-клуб. В шаговой доступности крупный ТЦ Галерея Аэропорт. Поблизости большая зелёная зона  Тимирязевский парк, а также благоустроенный Петровский парк.\\n\\nВ 8-ми минутах пешком  МЦД-2 Гражданская, в 15-ти минутах  м. Аэропорт. Автомобилистам будет удобно выезжать на ТТК через Ленинградский проспект.",
    "price": 160000,
    "priceInfo": null,
    "address": "Москва, САО, Аэропорт, Гражданская, Кочновский, 4к1",
    "link": "https://www.cian.ru/rent/flat/274116761/",
    "uId": 274116761,
    "images": "https://cdn-p.cian.site/images/72/940/131/1310492775-1.jpg,https://cdn-p.cian.site/images/72/940/131/1310492784-1.jpg,https://cdn-p.cian.site/images/72/940/131/1310492790-1.jpg,https://cdn-p.cian.site/images/72/940/131/1310492793-1.jpg,https://cdn-p.cian.site/images/72/940/131/1310492798-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492804-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492809-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492822-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492832-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492842-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492853-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492862-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492871-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492878-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492886-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492892-1.jpg,https://cdn-p.cian.site/images/82/940/131/1310492899-1.jpg,https://cdn-p.cian.site/images/92/940/131/1310492905-1.jpg,https://cdn-p.cian.site/images/92/940/131/1310492913-1.jpg", "jk": "ЖК «Аэробус»", "jkLink": "https://www.cian.ru/zhiloy-kompleks-aerobus-moskva-1773/", 
    "contacts": [{ "number": "79660271532", "name": "Аркадий Левинов" }], "floorNumber": 26, "area": "131.3", "dealType": "rent", "parsedFromLink": 2
})
 console.log(data);