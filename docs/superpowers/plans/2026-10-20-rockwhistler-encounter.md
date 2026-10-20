# Rockwhistler encounter implementation

1. Add the Rockwhistler abilities, Burrow status, summon event, and encounter state needed for alternating focus targets and one Call.
2. Plan focus, burrow, ambush, and call intents with Defend retaining absolute priority.
3. Resolve Burrow as untargetable, Ambush as a charge release, Call as two fresh Rockwhistlers, and grant enhanced Defend against Pack Attack.
4. Auto-resolve an ambush round when every living enemy is underground, without charging players PP or requiring an invalid target.
5. Connect all supplied sprites and animation poses, hide underground units, and expand the formation for summoned units.
6. Verify the mechanics with focused tests plus the full test, lint, and build checks.
