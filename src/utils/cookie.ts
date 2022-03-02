function setCookie(name: string, value: string, expires: number) {
  var exp = new Date();
  exp.setTime(exp.getTime() + expires * 1000);
  document.cookie =
    name + "=" + encodeURIComponent(value) + ";expires=" + exp.toUTCString();
}
//获取cookie
function getCookie(name: string) {
  var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
  if (arr != null) return decodeURIComponent(arr[2]);
  return false;
}
//删除cookies
function delCookie(name: string) {
  var exp = new Date();
  exp.setTime(exp.getTime() - 1);
  var cval = getCookie(name);
  if (cval != null)
    document.cookie = name + "=" + cval + ";expires=" + exp.toUTCString();
}

export const COOKIE = {
  get: getCookie,
  set: setCookie,
  del: delCookie,
};
