var baseURL = '210.118.74.107:3000';
var viewTree = {};
var _userId = 0;
var _polling;

viewTree = {
  init : function(userName) {

     //if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;  // for conciseness in defining templates
    myDiagram =
      $(go.Diagram, "myDiagram",  // must be the ID or reference to div
        {
          allowCopy: false,
          layout:  // create a TreeLayout for the family tree
            $(go.TreeLayout,
              { angle: 90, nodeSpacing: 50, layerSpacing: 50}),
          initialDocumentSpot: go.Spot.TopCenter,
          initialViewportSpot: go.Spot.TopCenter
        });
    var bluegrad = $(go.Brush, go.Brush.Linear, { 0: "rgb(60, 204, 254)", 1: "rgb(70, 172, 254)" });
    var pinkgrad = $(go.Brush, go.Brush.Linear, { 0: "rgb(255, 192, 203)", 1: "rgb(255, 142, 203)" });
    // Set up a Part as a legend, and place it directly on the diagram
    myDiagram.add(
      $(go.Part, "Table",
        { position: new go.Point(0, -80), selectable: true },
        $(go.TextBlock, "Info",
          { row: 0, font: "bold 10pt Helvetica, Arial, sans-serif" }),  // end row 0
        $(go.Panel, "Horizontal",
          { row: 1, alignment: go.Spot.Left },
          $(go.Shape, "Rectangle",
            { desiredSize: new go.Size(30, 30), fill: bluegrad, margin: 5 }),
          $(go.TextBlock, "In range",
            { font: "bold 8pt Helvetica, bold Arial, sans-serif" })
        ),  // end row 1
        $(go.Panel, "Horizontal",
          { row: 2, alignment: go.Spot.Left },
          $(go.Shape, "Rectangle",
            { desiredSize: new go.Size(30, 30), fill: pinkgrad, margin: 5 }),
          $(go.TextBlock, "Out range",
            { font: "bold 8pt Helvetica, bold Arial, sans-serif" })
        )  // end row 2
      ));
    // get tooltip text from the object's data
    function tooltipTextConverter(person) {
      var str = "";
      str += "manageMode: " + person.manageMode;
      str += "\naccumulateWarning: " + person.accumulateWarning;
      return str;
    }
    // define tooltips for nodes
    var tooltiptemplate =
      $(go.Adornment, "Auto",
        $(go.Shape, "Rectangle",
          { fill: "whitesmoke", stroke: "black" }),
        $(go.TextBlock,
          { font: "bold 8pt Helvetica, bold Arial, sans-serif",
            wrap: go.TextBlock.WrapFit,
            margin: 5 },
          new go.Binding("text", "", tooltipTextConverter))
      );
    // define Converters to be used for Bindings
    function nodeBrushConverter(accumulateWarning) {
      if (accumulateWarning == 0) return bluegrad;
      if (accumulateWarning > 0) return pinkgrad;
      return "orange";
    }
    // replace the default Node template in the nodeTemplateMap
    myDiagram.nodeTemplate =
      $(go.Node, "Auto",
        { deletable: false, toolTip: tooltiptemplate },
        new go.Binding("text", "name"),
        $(go.Shape, "Ellipse",
          { fill: "lightgray",
            stroke: "black",
            stretch: go.GraphObject.Fill,
            alignment: go.Spot.Center },
          new go.Binding("fill", "accumulateWarning", nodeBrushConverter)),
        $(go.TextBlock,
          { font: "bold 8pt Helvetica, bold Arial, sans-serif",
            alignment: go.Spot.Center,
            margin: 6 },
          new go.Binding("text", "", nodeTextConverter))
      );

    function nodeTextConverter(person) {
      var str = "";
      str += person.userNumber+"번\n";
      str += person.name;
      str += " ("+person.managingNumber+"/"+person.managingTotalNumber+")";
      str += "\nmanageMode: " + person.manageMode;
      str += "\naccumulateWarning: " + person.accumulateWarning;
      return str;
    }

    // define the Link template
    myDiagram.linkTemplate =
      $(go.Link,  // the whole link panel
        { routing: go.Link.Orthogonal, corner: 5, selectable: false },
        $(go.Shape));  // the default black link shape
    // here's the family data

    myDiagram.animationManager.isEnabled = false;
    viewTree.getUserName(userName);
  },

  getUserName : function(Name){
      $.ajax({
        type:"GET",
            url: 'http://'+baseURL+'/ptree/util/getUserNameFromID?userName='+Name,
            complete: function (data){
              _userId = data.responseJSON;
              viewTree.getTreeData(0);
            },
            error : function(data){
              //alert(JSON.parse(data));
            }
        });
  },

  getTreeData : function(time){
    _polling = setTimeout(function() {
        $.ajax({
          type:"GET",
              url: 'http://'+baseURL+'/ptree/util/showTreeV2?rootGroupMemberId='+_userId,
              complete: function (data){
                myDiagram.model = new go.TreeModel(data.responseJSON);
                viewTree.getTreeData(2000);
              },
              error : function(data){
                //alert(JSON.parse(data));
              }
          });
    }, time);
  }
};


