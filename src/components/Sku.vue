<template>
  <div class="container">

    <div class="sku-box">
      <div class="sku-col" v-for="item in state.properties" :key="item.attr_id">
        <p class="sku-title">{{item.attr_name}}： attr_id=>{{item.attr_id}}</p>

        <div class="sku-item-wrap">
          <div
            v-for="child in item.values"
            :key="child.attribute_id"
            class="sku-item"
            :class="{
              'disabled': +child?.disabled === 1,
              'act': state.selectedSku[child.attr_name] === child.com_id
            }"
            @click.stop="skuItemClick(child)"
          >{{child.attribute_value}}</div>
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
  skuData: [], //sku枚举
  selectedSku: {},  //当前选中的sku规格
})

//lifes
onMounted(() => {
  getSkuData()
  calcSku()
})


/**
 * @description: 模拟请求，获取sku数据，初始化
 */
const getSkuData = () => {
  let { properties, skuData } = CloneDeep(ResData)
  let selectedSku = {}  //已被选中的sku规格

  //为了方便后续使用，调整数据结构
  properties.forEach(item => {
    //以 key-value的形式，初始化默认值, 如 颜色:'xxx'，尺码:'xxx' ... 实际业务中推荐使用attr_id作为key，避免汉字可能出现重复的问题
    selectedSku[item.attr_name] = '' 

    item.attr_id = +item?.attr_id || 0  //格式化为Number类型

    item.values.forEach(it => {
      it.attr_id = +item?.attr_id || 0 //父级的id值
      it.attr_name = item.attr_name //父级的规格类名称
      it.attribute_id = +it?.attribute_id || 0//格式化为Number类型
      it.com_id = `${it?.attr_id}:${it?.attribute_id}`
    })
  })

  skuData.forEach(it => {
    it.properties_arr = it.properties.split(',')
  })


  console.log(`初始化获取数据时，selectedSku ->`, selectedSku)
  state.properties = properties
  state.skuData = skuData
  state.selectedSku = selectedSku
}




/**
 * @description: 规格计算，遍历所有规格，将无效的规格设置为disabled=1
 */
const calcSku = () => {
  let properties = CloneDeep(state.properties)

  properties.forEach(item => {
    item.values.forEach(it => {
      const is_effect = isEffectSku(it.attr_name, it.com_id)
      it.disabled = is_effect ? 0 : 1
    })
  })

  console.log(`经过计算，新的properties ->`, properties)
  state.properties = properties
}


/**
 * @description: 验证某一个规格，是否为有效的规格(此规格存在并且库存>0)
 */    
const isEffectSku = (key, value) => {
  const skuData = CloneDeep(state.skuData)
  let selectedSku = CloneDeep(state.selectedSku)
  selectedSku[key] = value
  let selectedSkuArr = Object.values(selectedSku).filter(it => it.length > 0)

  //判断数组A是否为数组B的子集
  const _isChildArr = (listA, listB) => {
    if (listA.length === 0 || listB.length === 0) return false
    return listA.every(it => listB.includes(it))
  }

  const has_stock = skuData.some(it => _isChildArr(selectedSkuArr, it.properties_arr) && +it?.stock > 0)
  return has_stock
}



/**
 * @description: 规格项点击
 */    
const skuItemClick = (item) => {
  const { disabled, attr_name, com_id } = item
  let selectedSku = CloneDeep(state.selectedSku)
  if (+disabled === 1) {
    console.log('该项已被禁用，return')
    return
  }

  console.log(`点击项为 ->`, {...item})
  selectedSku[attr_name] = selectedSku[attr_name] === com_id ? '' : com_id
  state.selectedSku = selectedSku
  console.log(`新的 selectedSku ->`, selectedSku)

  calcSku()
}



</script>

<style lang="less" scoped>
.container{
  width: 100%;
  height: 100vh;
  background-color: #eaeaea;
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
        font-weight: 500;
      }

      .act{ //选中激活的样式
        background-color: lightblue;
      }

      .disabled{//无效禁用的样式
        color: #d8d8d8;
        font-weight: 400;
      }
    }
  }
}
</style>