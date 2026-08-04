{
  query: "query($accountTag: String!, $script: String!, $from: Time!, $to: Time!){ viewer { accounts(filter:{accountTag:$accountTag}) { workersInvocationsAdaptive(limit: 1000, filter:{ scriptName: $script, datetime_geq: $from, datetime_leq: $to }) { sum { requests errors } } } } }",
  variables: { accountTag: $acct, script: $script, from: $from, to: $to }
}
