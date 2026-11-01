# Synthetic GraphQL response nodes; IDs deliberately differ from logins.
def conn($nodes): {nodes:$nodes};
def actor($id): {databaseId:$id,login:"untrusted-login"};
def approved: {__typename:"LabeledEvent",createdAt:"2026-10-30T10:00:00Z",actor:actor(2433928),label:{id:"LA_kwDOVbvt8s8AAAADARxrMw",name:"approved"}};
def issue($n;$body): {__typename:"Issue",id:("I"+($n|tostring)),number:$n,title:("Task "+($n|tostring)),body:$body,url:("https://github.com/januswtlin/januslin.me/issues/"+($n|tostring)),state:"OPEN",stateReason:null,lastEditedAt:null,updatedAt:"2026-10-31T00:00:00Z",parent:null,labels:conn([{id:"task",name:"task"},{id:"LA_kwDOVbvt8s8AAAADARxrMw",name:"approved"}]),assignees:conn([]),timelineItems:conn([approved]),userContentEdits:conn([]),comments:conn([]),subIssues:conn([])};
{repo:{issues:conn([{id:"I54",number:54},{id:"I55",number:55},{id:"I56",number:56},{id:"I59",number:59}]),pullRequests:conn([]),refs:conn([])},nodes:{}}
| .nodes.I53=issue(53;"plan")
| .nodes.I53.subIssues=conn([{number:54},{number:55},{number:56}])
| .nodes.I54=issue(54;"**Depends on:** none")
| .nodes.I55=issue(55;"**Depends on:** #57, #58")
| .nodes.I56=issue(56;"**Depends on:** none")
| .nodes.I56.assignees=conn([actor(9988)])
| .nodes.I57=(issue(57;"")|.state="CLOSED"|.stateReason="COMPLETED"|.timelineItems=conn([{__typename:"ClosedEvent",createdAt:"2026-10-30T09:00:00Z",actor:actor(2433928)}]))
| .nodes.I58=.nodes.I57 | .nodes.I58.id="I58" | .nodes.I58.number=58
| .nodes.I59=(issue(59;"**Blocked by:** #57")|.labels=conn([{id:"human",name:"human-task"}])|.parent={number:54}|.assignees=conn([actor(2433928)]))
| .nodes.C1={__typename:"IssueComment",id:"C1",author:actor(2433928),body:"author instruction",createdAt:"2026-10-30T11:00:00Z",updatedAt:"2026-10-30T11:00:00Z",lastEditedAt:null,userContentEdits:conn([])}
| .nodes.I54.comments=conn([.nodes.C1|{id,author,createdAt,updatedAt,lastEditedAt,body}])
