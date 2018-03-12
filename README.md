# openab2

## Personal config
Copies of config files are in .config

#Scripts 
Use scripts to rsync different parts into public repos. 

## Useage

The following is an extract from Habpanel which shows how to send commands to the item. 
Send ON,OFF,TOGGLE to LivingRoomCommand.

```
<div class="section">


  <div class="controls">
    <div class="widget">
      <div class="controlGroup">
        <div class="icon off" ng-click="sendCmd('TuyaManual', 'state')"><svg viewBox="0 0 48 48"><use xlink:href="/static/matrix-theme/squidink.svg#double-arrow"></use></svg></div>
        <div class="nameGroup"><div class="name">Update state</div></div>
      </div>
    </div>


    <div class="widget">
      <div class="icon on" ng-click="sendCmd('BedroomHeaterCommand', 'TOGGLE')" ><svg viewBox="0 0 48 48"><use ng-if="itemValue('BedroomHeater')!='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#off"></use><use ng-if="itemValue('BedroomHeater')=='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#on"></use></svg></div>
      <div class="name">Bedroom Heater: {{itemValue('BedroomHeater')}}</div>
    </div>
    <div class="widget">
      <div class="icon on" ng-click="sendCmd('LivingRoomHeaterCommand', 'TOGGLE')" ><svg viewBox="0 0 48 48"><use ng-if="itemValue('LivingRoomHeater')!='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#off"></use><use ng-if="itemValue('LivingRoomHeater')=='ON'" xlink:href="/static/matrix-theme/matrixicons.svg#on"></use></svg></div>
      <div class="name">Living Room Heater: {{itemValue('LivingRoomHeater')}} </div>
    </div>
  </div>
 <div class="bigDash">


    <div class="description">Living room Heater: {{itemValue('LivingRoomHeater')}}         </div>
    <div class="top">
      <div class="icon on"><svg viewBox="0 0 48 48"><use xlink:href="/static/matrix-theme/squidink.svg#thermometer-3"></use></svg></div>
      <div class="value">
        <div class="main">{{itemValue('KitchenThermostatCurrentTemp') | number:1}}</div>
        <div class="sub">&#176C</div>
      </div>
    </div>

    <div class="bottom" ng-init="switchState=itemValue('LivingRoomHeater'); ttoggle=true">


      <div class="name">Set Target Temp: {{itemValue('KitchenThermostatTargetTemp')}}</div>
      
      <div ng-init="slider = { value: 20, options: { floor: 15, ceil: 40, step: 1, showSelectionBar: true } }; slider.value=itemValue('KitchenThermostatTargetTemp')"></div>
      
          <div ng-switch on="slider.value">
          <div ng-switch-default><div ng-init="sendCmd('KitchenThermostatTargetTemp', slider.value)"></div></div>
        </div>
      <rzslider rz-slider-model="slider.value" rz-slider-options="slider.options" ></rzslider>
    </div>
  </div>
</div>
  ```
