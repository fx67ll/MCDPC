// @name: nanjingData
// @author: fx67ll
// @version: 1.1.0
// @description：南京为中心主题的各 Demo 共用数据，包含南京 11 个区的中心坐标、adcode 与基础权重。

// 南京市中心
export const NANJING_CENTER = [118.7969, 32.0603];

// 南京市 adcode
export const NANJING_ADCODE = '320100';

// 南京下辖区县：name 名称，center 中心点，adcode 编码，base 基础热度/权重(0-100)
export const NANJING_DISTRICTS = [
  { name: '玄武区', center: [118.7978, 32.0487], adcode: '320102', base: 92 },
  { name: '秦淮区', center: [118.7944, 32.0211], adcode: '320104', base: 88 },
  { name: '建邺区', center: [118.7326, 32.0036], adcode: '320105', base: 80 },
  { name: '鼓楼区', center: [118.7702, 32.0665], adcode: '320106', base: 95 },
  { name: '浦口区', center: [118.6253, 32.0594], adcode: '320111', base: 68 },
  { name: '栖霞区', center: [118.9087, 32.0964], adcode: '320113', base: 72 },
  { name: '雨花台区', center: [118.7722, 31.9923], adcode: '320114', base: 70 },
  { name: '江宁区', center: [118.8399, 31.9534], adcode: '320115', base: 78 },
  { name: '六合区', center: [118.8416, 32.3402], adcode: '320116', base: 55 },
  { name: '溧水区', center: [119.0287, 31.6512], adcode: '320117', base: 48 },
  { name: '高淳区', center: [118.8921, 31.3274], adcode: '320118', base: 45 },
];

// 飞线 Demo 的中心点候选（全部 11 个区都可作为中心，切换时互为起讫点）
export const NANJING_HUBS = NANJING_DISTRICTS.map(function (d) {
  return { name: d.name, center: d.center, adcode: d.adcode };
});
