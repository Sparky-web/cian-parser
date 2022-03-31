import axios from "./axiosInstance"
import qs from "querystring"

var isObj = function (a) {
    if ((!!a) && (a.constructor === Object)) {
        return true;
    }
    return false;
};
var _st = function (z, g) {
    return "" + (g != "" ? "[" : "") + z + (g != "" ? "]" : "");
};
var fromObject = function (params, skipobjects, prefix) {
    if (skipobjects === void 0) {
        skipobjects = false;
    }
    if (prefix === void 0) {
        prefix = "";
    }
    var result = "";
    if (typeof (params) != "object") {
        return prefix + "=" + encodeURIComponent(params) + "&";
    }
    for (var param in params) {
        var c = "" + prefix + _st(param, prefix);
        if (isObj(params[param]) && !skipobjects) {
            result += fromObject(params[param], false, "" + c);
        } else if (Array.isArray(params[param]) && !skipobjects) {
            params[param].forEach(function (item, ind) {
                result += fromObject(item, false, c + "[" + ind + "]");
            });
        } else {
            result += c + "=" + encodeURIComponent(params[param]) + "&";
        }
    }
    return result;
};

export const fetchData = async (type, filters = {}) => {
    const url = `/api/${type}?${fromObject(filters)}`
    console.log(url)
    const { data } = await axios.get(url)
    return data
}

window.fetchData = fetchData

export const startManualParsing = async (id) => {
    await axios.get(apiUrl + "/start-manual", { params: { id } })
}

export const apiUrl = (() => {
    let url = new URL(location)
    url.port = 1001

    return url.origin
})()

export const serializeProxy = proxy => {
    const withoutProtocol = proxy.split("//")?.[1]
    const splat = withoutProtocol.split("@")
    return `${splat?.[1]}:${splat?.[0]}`
}

export default { fetchData, startManualParsing, serializeProxy }