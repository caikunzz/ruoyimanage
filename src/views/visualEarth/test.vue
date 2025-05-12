<template>
  <div style="display: none"></div>
</template>

<script>
export default {
  data(){
    return{

    }
  },
  methods:{
    showEntityTip(_, entity){
      entity.label.text = "！！！"
    },
    showEntityInfo(_, entity){
      if (entity.type !== "image") return
      this.$cesiumHelper.updateObjById(entity.id, {material:{targetLine: {style: "dashed"}},animation: {autoRotate: true, targetLine: {type: "entity", value:  "285b0c79933b47a983ae3953a6685eae"}}})
      const dom = entity.infobox
      if (dom instanceof HTMLElement){
        setTimeout(()=>{
          dom.className = "cesium-helper-infobox-horn-block-4"
          dom.innerHTML = "<span>柴油：900/1000吨</span><span>煤油：1000/1000吨</span>"
        }, 3000)
      }

    }
  },
  // mounted() {
  //   this.$nextTick(()=>{
  //     this.$cesiumHelper.addEntityActivateEvent("test-click", this.showEntityInfo.bind(this))
  //   })
  // },
  // destroyed() {
  //   this.$cesiumHelper.removeEntityActivateEvent("test-click")
  // }
}
</script>

<style scoped lang="less">

</style>

<style>
.cesium-helper-infobox-horn-block-3 {
  --borderColor: #ffb800;

  position: absolute;
  transform: translateY(-50%) translateX(-50%);

  box-shadow: 0 0 1.5vw rgba(255, 255, 255, 0.34) inset;
  cursor: pointer;
  text-align: center;
  min-height: 35px;
  background: linear-gradient(to left, var(--borderColor), var(--borderColor)) left top no-repeat,
  linear-gradient(to bottom, var(--borderColor), var(--borderColor)) left top no-repeat,
  linear-gradient(to left, var(--borderColor), var(--borderColor)) right top no-repeat,
  linear-gradient(to bottom, var(--borderColor), var(--borderColor)) right top no-repeat,
  linear-gradient(to left, var(--borderColor), var(--borderColor)) left bottom no-repeat,
  linear-gradient(to bottom, var(--borderColor), var(--borderColor)) left bottom no-repeat,
  linear-gradient(to left, var(--borderColor), var(--borderColor)) right bottom no-repeat,
  linear-gradient(to left, var(--borderColor), var(--borderColor)) right bottom no-repeat;
  background-size: 2px 10px, 10px 2px, 2px 10px, 10px 2px;
  border: 2px solid transparent;
  color: white;
  font-size: 16px;
  letter-spacing: 0.1em;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  overflow: hidden;
  align-items: center;

  padding: 0 10px;

  span {
    min-width: 224px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.cesium-helper-infobox-horn-block-4 {

  width: 180px;
  height: 116px;

  position: absolute;
  transform: translateY(-65%) translateX(-50%);

  cursor: pointer;

  background-image: url("@/assets/images/poper/提示框.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  overflow: hidden;
  align-items: center;

  color: white;

  span{
    font-size: 12px;
  }

  & > *{
    position: relative;
    top: -10px;
  }
}

.cesium-helper-infobox-horn-block-5{
  position: absolute;
  transform: translateY(-5%) translateX(-50%);

  i{
    font-size: 30px;
    color: yellow;
  }
}
</style>
