![](./badge.svg)

# TestingChart

### Install

```
$ yarn add https://github.com/reuters-graphics/chart-module-covid-testing.git
```

### Use

```javascript
import TestingChart from '@reuters-graphics/chart-module-covid-testing';

const myChart = new TestingChart();

// To create your chart, pass a selector string to the chart's selection method,
// as well as any props or data to their respective methods. Then call draw.
myChart
  .selection('#chart')
  .data({
        cases: caseData.cases,
        tests: testData.testingData.test_dailycount,
        iso: testData.countryISO,
      })
  .props({ 
    // chart height
    height: 400,
    // margins
    margin: {
      left: 50,
      right: 50,
      top: 10,
      bottom: 30,
    },
    // if there is a specific start date for the chart
    range: {
      startDate: '2020-03-01',
    },
    formatters: {
      // time format in data
      caseTime: '%Y-%m-%d',
      // date format in x axis
      date: '%B',
    },
    fills: {
      // line fill
      tests: '#eec331',
      // ref box fill
      refbox: 'rgba(255,255,255,.1)',
      // ref box label fill
      label: 'rgba(255,255,255,.9)',
    },
    // rolling avg of how many days
    avg_days: 7,
    // ref box range
    refBox: { y1: 0, y2: 5 },
    refLabel: {
      // ref label text
      text: 'W.H.O. recommendation'
    },
    // stroke width for line
    lineThickness: 2, 
  })
  .draw();

// Or just call the draw function alone, which is useful for resizing the chart.
myChart.draw();
```

To apply this chart's default styles when using SCSS, simply define the variable `$TestingChart-container` to represent the ID or class of the chart's container(s) and import the `_chart.scss` partial.

```CSS
$TestingChart-container: '#chart';

@import '~@reuters-graphics/chart-module-covid-testing/scss/main';
```

## Developing chart modules

Read more in the [DEVELOPING docs](./DEVELOPING.md) about how to write your chart module.
