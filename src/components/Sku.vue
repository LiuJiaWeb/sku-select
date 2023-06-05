<template>
  <div class="container">

    <div class="sku-box">
      <div class="sku-col" v-for="(child, childIndex) in state.properties" :key="child.attr_id">
        <p class="sku-title">{{child.attr_name}}： attr_id=>{{child.attr_id}}</p>

        <div class="sku-item-wrap">
          <div
            v-for="(skuItem, skuItemIndex) in child.values"
            :key="skuItem.attribute_id"
            class="sku-item"
            :class="`status-${skuItem.status}`"
            @click.stop="btnClick({
              attr_id: +child.attr_id,
              attribute_id: +skuItem.attribute_id,
              status: +skuItem.status,
              attr_idx: +childIndex,
              attribute_idx: +skuItemIndex
            })"
          >{{skuItem.attribute_value}}</div>
        </div>
      </div>
    </div>


  </div>
</template>



<script setup>
import ResData from '@/mock/mockData.js';
import CloneDeep from 'lodash.clonedeep';
import { onMounted, reactive } from 'vue';

//data
const state = reactive({
  properties: [], //规格类目
  skuData: [] //sku枚举
})

//lifes
onMounted(async () => {
  await getSkuData()
  await calc()
})

//function

/**
 * @description: 模拟请求，获取sku数据
 */
const getSkuData = () => {
  let { properties, skuData } = CloneDeep(ResData)

  //为了方便后续使用，微调数据结构
  properties.forEach((it, itIdx) => {
    it.values.forEach((item, itemIdx) => {
      item.attr_id = it.attr_id //父级的id值
      item.attr_idx = itIdx //父级的index值
      item.attribute_idx = itemIdx  //自身的index值
      item.com_id = `${it.attr_id}:${item.attribute_id}`  //组合id，构成为 `父级ID:自身ID`
      item.status = 0 //状态值  0:默认  1:选中激活  2:禁用置灰
    })
  })

  skuData.forEach(it => {
    it.properties_arr = it.properties.split(',')  //将规格组合值由原来的字符串拆为数组形式，方便后续使用
  })


  state.properties = properties
  state.skuData = skuData
}


/**
 * @description: 按钮点击
 */
const btnClick = (params) => {
  const { status, attr_id, attr_idx, com_id, sku_img, value_id, value_idx } = params;
  if (+status === 2) return;
  let properties = CloneDeep(state.properties);
  properties[attr_idx].values.forEach((it) => {
    it.status = +it?.status === 2 ? 2 : 0;
  });
  properties[+attr_idx].values[+value_idx].status = +status === 0 ? 1 : 0;
  state.properties = properties;
  calc()
}


/**
 * @description: 计算
 */
const calc = () => {
  let properties = CloneDeep(state.properties)
  const hasSelectedArr = getSelectedItem(properties)
  console.log('calc hasSelectedArr =>', hasSelectedArr)

  //当前没有任何已经被选择的项
  if(!hasSelectedArr || hasSelectedArr.length===0){
    console.log('hasSelectedArr empty, run init')
    state.properties = init(properties)
    return
  }

  //存在已被选择的项
  properties.forEach(it => {
    it.values.forEach(item => {
      const checkArr = combineArr(item.com_id, hasSelectedArr)  //去除相同项，去重
      const isEffect = isEffectSku(checkArr)  //检查是否有库存，判定是否有效
      if(isEffect){
        item.status = +item.status === 1 ? 1 : 0
      }else{
        item.status = 2
      }
    })
  })

  state.properties = properties

}


/**
 * @description: 获取已被选择的数组
 */
const getSelectedItem = (list) => {
  const _list = CloneDeep(list)
  if(!_list || _list.length===0) return []

  let res = []
  _list.forEach(it => {
    it.values.forEach(item => {
      if(+item.status === 1){
        res.push(`${it.attr_id}:${item.attribute_id}`)
      }
    })
  })
  return res
}


/**
 * @description: 初始化，默认情况下将按钮状态根据库存情况重置一次
 */    
const init = (list = []) => {

  let properties = CloneDeep(list)
  const skuData = CloneDeep(state.skuData)

  if (!properties || properties.length === 0) {
    return []
  }

  properties.forEach(it => {
    it.values.forEach(item => {
      //判断当前项是否有效，条件为：必须在规格中存在 && 有库存，使用some，至少有一项符合，就认为有效，否则禁用
      const isEffect = skuData.some(skuItem => skuItem.properties.includes(`${it.attr_id}:${item.attribute_id}`) && +skuItem.stock > 0)

      //初始化设置按钮块的状态  status状态说明:  0:默认状态  1:选中激活状态  2:置灰禁用状态
      item.status = isEffect ? (+item.status === 1 ? 1 : 0) : 2
    })
  })

  return properties
}


/**
 * @description: 合并相似数组(并去重)
 * @params {String} self_com_id: 自身的组合Id，`${it.attr_id}:${item.attribute_id}`
 * @params {Array} selected_arr: 已被选择的项组合
 */    
const combineArr=(self_com_id, selected_arr)=>{
  let _self_com_id = CloneDeep(self_com_id)
  let _selected_arr = CloneDeep(selected_arr)
  const self_main = _self_com_id.split(':')[0]
  
  let filter = [_self_com_id]
  for(let i =0; i< _selected_arr.length; i++){
    const hasIt = _selected_arr[i].includes(self_main)
    if(!hasIt){
      filter.push(_selected_arr[i])
    }
  }
  filter = Array.from(new Set(filter))
  return filter
}


/**
 * @description: 检验当前选择的是否为有效规格
 * @param {*} curSkuArr
 */    
const isEffectSku =(curSkuArr = []) =>{
  const skuData = CloneDeep(state.skuData)
  const res = skuData.some(it => isChildArr(it.properties_arr,curSkuArr) && +it.stock > 0)
  return res
}




/**
 * @description: 传入2个数组，判断一个数组是否为另一个的子集
 */    
const isChildArr =(listA, listB) => {
  if (listA.length === 0 || listB.length === 0) return false
  let res = false

  let s_arr = []  //长度较短的数组
  let l_arr = []  //长度较长的数组

  if (listA.length > listB.length) {
    l_arr = listA
    s_arr = listB
  } else {
    l_arr = listB
    s_arr = listA
  }
  res = s_arr.every(it => l_arr.includes(it))
  return res
}


</script>

<style lang="less" scoped>
.container{
  width: 100%;
  height: 100vh;
  background-color: #dcdcdc;
}

.sku-box{
  width: 100%;
  padding: 28px 24px 42px 24px;
  border-radius: 16px;
  margin: 0 auto;

  .sku-col{
    width: 100%;
    margin-top: 48px;

    .sku-title{
      max-width: 100%;
      font-size: 28px;
      font-weight: 500;
      color: #202124;
      line-height: 42px;
    }

    .sku-item-wrap{
      width: 100%;
      display: flex;
      flex-wrap: wrap;


      .sku-item{
        min-width: 100px;
        height: 60px;
        background-color: #FFFFFF;
        border-radius: 16px;
        padding: 0 26px;
        font-size: 24px;
        color: #202124;
        margin: 16px 24px 0 0;
        text-align:center;
        line-height: 60px;
      }

      .status-1{
        background-color: rgba(252, 13, 94, 0.1);
        opacity: 0.8;
        font-weight: 500;
        color: #FC0D5E;
      }

      .status-2{
        color: #B8BABF;
      }
    }
  }
}
</style>