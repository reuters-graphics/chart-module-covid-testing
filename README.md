![](./badge.svg)

# TestingChart

### Install

```
$ yarn add https://github.com/reuters-graphics/chart-module-testingchart.git
```

### Use

```javascript
import TestingChart from '@reuters-graphics/chart-module-testingchart';

const myChart = new TestingChart();

// To create your chart, pass a selector string to the chart's selection method,
// as well as any props or data to their respective methods. Then call draw.
myChart
  .selection('#chart')
  .data([1, 2, 3])
  .props({ stroke: 'orange' })
  .draw();

// You can call any method again to update the chart.
myChart
  .data([3, 4, 5])
  .draw();

// Or just call the draw function alone, which is useful for resizing the chart.
myChart.draw();
```

To apply this chart's default styles when using SCSS, simply define the variable `$TestingChart-container` to represent the ID or class of the chart's container(s) and import the `_chart.scss` partial.

```CSS
$TestingChart-container: '#chart';

@import '~@reuters-graphics/chart-module-testingchart/scss/main';
```

## Developing chart modules

Read more in the [DEVELOPING docs](./DEVELOPING.md) about how to write your chart module.
