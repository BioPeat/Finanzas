# MAPA DEL CÓDIGO · Finanzas v4

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 442

## Utilidades (línea 444)
- `localDate(d)` · línea 453
- `addDays(s,n)` · línea 454
- `monthAdd(m,n)` · línea 456
- constante `MONTHS` · línea 457
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 460
- `nf(n,d=2,min=d)` · línea 461
- `money(eur,opts={})` · línea 463
- `toNum(v)` · línea 474
- `toDate(v,dmy=true)` · línea 485
- constante `ICON` · línea 496

## Estado y guardado (línea 530)
- constante `LISTS` · línea 533
- constante `MAPS` · línea 534
- constante `SHARED` · línea 535
- `defaults()` · línea 536
- `load()` · línea 554
- `migrate(o)` · línea 559
- `save(sync=true)` · línea 568
- `stampChanges(before)` · línea 575
- `change(fn,msg)` · línea 592
- `undo()` · línea 599
- `toast(text,canUndo=false)` · línea 609

## Categorías (línea 616)
- constante `CATS` · línea 618
- constante `RULES_BASE` · línea 630
- `merchantOf(desc)` · línea 651
- `categorize(t)` · línea 659

## Importar archivos (Excel .xlsx y CSV) (línea 669)
- `unzip(buf)` · línea 671
- `readXlsx(buf)` · línea 686
- `parseCSV(text)` · línea 693
- `findHeader(rows,needles)` · línea 707
- constante `FORMATS` · línea 712
- `detect(rows)` · línea 720
- `col(hs,...names)` · línea 724
- `parseBank(rows,fmt,head)` · línea 726
- `normAsset(a)` · línea 741
- `binanceKind(op,acct)` · línea 746
- `krakenKind(type,sub)` · línea 758
- `parseLedger(rows,fmt,head,map)` · línea 767
- `parseOFX(text)` · línea 798
- `parseQIF(text)` · línea 806
- `readFile(file)` · línea 812
- `importFiles(files)` · línea 821
- `openImport(rows,det,fname,map)` · línea 833
- `openMapper(rows,fname)` · línea 869
- `openPositionsImport(rows,head,fname,map)` · línea 894
- `importBackup(o)` · línea 902

## Activos y precios (línea 908)
- constante `FIAT` · línea 909
- constante `STABLE` · línea 910
- constante `CLASS_NAMES` · línea 911
- constante `CLASS_COLOR` · línea 912
- `ensureAsset(sym)` · línea 913
- `priceEUR(sym)` · línea 916
- `fx(cur)` · línea 922
- `trackedAssets()` · línea 924
- `refreshPrices(force=false)` · línea 931
- `directPrices(cryptos)` · línea 946
- `priceAt(sym,t)` · línea 954

## Cartera: qué tienes y cuánto vale (línea 971)
- `bankBalance(a)` · línea 972
- `positionRows()` · línea 981
- `derivRows()` · línea 993
- `netWorth()` · línea 1002
- `snapshot()` · línea 1009
- `bankHistory(days=365)` · línea 1016
- `netSeries(days)` · línea 1027

## Movimientos: resúmenes del mes (línea 1034)
- `monthTotals(m)` · línea 1035
- `lastMonths(n)` · línea 1042
- `recurring()` · línea 1044

## Análisis: de un vistazo (línea 1056)
- `liquidity()` · línea 1058
- `avgMonthlyExpense()` · línea 1060
- `cushion()` · línea 1062
- `pace()` · línea 1064
- `upcoming(days=31)` · línea 1070
- `forecast()` · línea 1080
- `topMerchants(m,n=5)` · línea 1092
- `dailySpend(m)` · línea 1093
- `insights()` · línea 1095

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 1108)
- constante `TRAMOS_AHORRO` · línea 1110
- `cuotaAhorro(base)` · línea 1111
- `matchTransfers(L)` · línea 1113
- `taxGroups()` · línea 1119
- `taxPrefetch(onStep)` · línea 1125
- `taxCompute()` · línea 1134
- `balancesAt(date)` · línea 1175
- `modelo721(year)` · línea 1176
- `taxSummary(year,extra=0)` · línea 1182
- `byCoin(disp)` · línea 1187

## Conexión con el Worker (exchanges, precios, sincronización) (línea 1189)
- `api(path,opts={})` · línea 1190
- constante `EXCH` · línea 1202
- `syncBalances(manual=false)` · línea 1204

## Sincronización cifrada entre dispositivos (línea 1225)
- `b64u(b)` · línea 1228
- `syncKey()` · línea 1230
- `syncId()` · línea 1231
- constante `LOCAL_ONLY` · línea 1232
- `syncPayload()` · línea 1233
- `encrypt(obj)` · línea 1234
- `decrypt(s)` · línea 1240
- `mergeStates(local,remote)` · línea 1246
- `scheduleSync(ms=1500)` · línea 1273
- `syncNow(manual=false)` · línea 1274
- `ago(t)` · línea 1303
- `paintSync()` · línea 1304
- `pairLink()` · línea 1313
- `readPair()` · línea 1314

## Avisos (línea 1323)
- `alerts()` · línea 1324

## Gráficos interactivos (SVG propios, sin librerías) (línea 1341)
- constante `CHARTS` · línea 1343
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1346
- `svgCompare(m)` · línea 1361
- `svgDays(m)` · línea 1375
- `svgMonths(months)` · línea 1384
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1391
- `allocBar(parts,total)` · línea 1397
- `bindCharts(root=document)` · línea 1401

## Navegación (línea 1433)
- constante `VIEWS` · línea 1435
- constante `TABS` · línea 1436
- constante `RANGES` · línea 1438
- `go(v,f)` · línea 1439
- `navBtns(cls)` · línea 1440
- `renderNav()` · línea 1441
- `render()` · línea 1451
- `head(title,sub,actions='')` · línea 1461
- `catInitials(c)` · línea 1463
- `initials(s)` · línea 1465
- `assetColor(sym)` · línea 1467
- `moneyBig(eur)` · línea 1469
- `rangeBtns()` · línea 1474
- `deltaPill(chg,base,txt)` · línea 1476
- constante `RANGE_TXT` · línea 1477

## Inicio (línea 1479)
- `vResumenMobile()` · línea 1480
- `greeting()` · línea 1491
- `safeToSpend()` · línea 1493
- `accValue(a,rows)` · línea 1494
- `accCard(a,rows)` · línea 1495
- `vResumen()` · línea 1500
- `catRow(k,v,max,total,attrs)` · línea 1537
- `onboarding()` · línea 1541
- `txItem(t)` · línea 1549
- `goalRow(g)` · línea 1553
- `goalSaved(g)` · línea 1558

## Movimientos (pestaña «Gastos») (línea 1560)
- `filtered()` · línea 1561
- `vMovs()` · línea 1566
- `editTx(id)` · línea 1594
- `quickAdd()` · línea 1605

## Objetivos y presupuestos (línea 1618)
- `vGoals()` · línea 1619
- `editGoal(id)` · línea 1627

## Inversiones (línea 1637)
- `costBasis()` · línea 1638
- `invSeries(days)` · línea 1640
- `vInv()` · línea 1644
- constante `PAL` · línea 1674
- `invDonut(list,total)` · línea 1675
- `accTable(rows)` · línea 1676
- constante `OPK` · línea 1680
- `opsTable(ops)` · línea 1681
- `tvSymbol(sym)` · línea 1686
- `tradingViewURL(sym)` · línea 1693
- `assetDetail(sym)` · línea 1694
- `editOp(id)` · línea 1705
- `editDeriv(id)` · línea 1717

## Impuestos (línea 1730)
- `vTax()` · línea 1732
- `taxCSV(year)` · línea 1756
- `taxAIText(year)` · línea 1765

## Cuentas (línea 1776)
- constante `KIND_NAMES` · línea 1777
- constante `KIND_ICON` · línea 1778
- `vCuentas()` · línea 1779
- `editAcc(id)` · línea 1789

## Ajustes (línea 1800)
- constante `WORKER_STEPS` · línea 1801
- `vAjustes()` · línea 1802
- `workerInfoHTML(i)` · línea 1823
- `vMas()` · línea 1828

## Ventana, descargas y acciones (línea 1846)
- `modal(title,html)` · línea 1847
- `download(name,text,type='application/json')` · línea 1848
- `copyText(t,msg='Copiado')` · línea 1849
- `openDrawer()` · línea 1853
- `closeDrawer()` · línea 1854
- `act(a,el)` · línea 1855
- `confirmTwice(el)` · línea 1938
- `afterRender()` · línea 1975

## Arranque (línea 1989)
- `refreshAll(force)` · línea 1991
- `init()` · línea 1997
