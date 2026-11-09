# MAPA DEL CÓDIGO · Finanzas v9

Generado automáticamente. Busca por función; las líneas cambian.


## Utilidades · línea 579
- `localDate(d)` · línea 588
- `addDays(s,n)` · línea 589
- `monthAdd(m,n)` · línea 591
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 595
- `nf(n,d=2,min=d)` · línea 596
- `money(eur,opts={})` · línea 598
- `toNum(v)` · línea 609
- `toDate(v,dmy=true)` · línea 620

## Estado y guardado · línea 669
- `defaults()` · línea 675
- `load()` · línea 694
- `migrate(o)` · línea 699
- `autoBackup()` · línea 709
- `backupInfo()` · línea 717
- `restoreAutomaticBackup()` · línea 718
- `save(sync=true)` · línea 719
- `stampChanges(before)` · línea 726
- `change(fn,msg)` · línea 743
- `undo()` · línea 750
- `toast(text,canUndo=false)` · línea 760

## Categorías · línea 767
- `merchantOf(desc)` · línea 802
- `categorize(t)` · línea 810

## Importar archivos (Excel .xlsx y CSV) · línea 820
- `unzip(buf)` · línea 822
- `readXlsx(buf)` · línea 837
- `parseCSV(text)` · línea 844
- `findHeader(rows,needles)` · línea 858
- `detect(rows)` · línea 871
- `col(hs,...names)` · línea 875
- `parseBank(rows,fmt,head)` · línea 877
- `normAsset(a)` · línea 892
- `binanceKind(op,acct)` · línea 897
- `krakenKind(type,sub)` · línea 909
- `parseLedger(rows,fmt,head,map)` · línea 918
- `parseOFX(text)` · línea 949
- `parseQIF(text)` · línea 957
- `readFile(file)` · línea 963
- `importFiles(files)` · línea 972
- `openImport(rows,det,fname,map)` · línea 984
- `openMapper(rows,fname)` · línea 1020
- `openPositionsImport(rows,head,fname,map)` · línea 1045
- `importBackup(o)` · línea 1053

## Activos y precios · línea 1059
- `ensureAsset(sym)` · línea 1064
- `priceEUR(sym)` · línea 1067
- `fx(cur)` · línea 1073
- `trackedAssets()` · línea 1075
- `refreshPrices(force=false)` · línea 1082
- `directPrices(cryptos)` · línea 1097
- `priceAt(sym,t)` · línea 1105

## Cartera: qué tienes y cuánto vale · línea 1122
- `bankBalance(a)` · línea 1123
- `positionRows()` · línea 1132
- `derivRows()` · línea 1144
- `netWorth()` · línea 1153
- `investmentSummary()` · línea 1161
- `snapshot()` · línea 1169
- `bankHistory(days=365)` · línea 1176
- `reliableHistory(points)` · línea 1187
- `netSeries(days)` · línea 1199
- `changeWindow(days)` · línea 1211

## Movimientos: resúmenes del mes · línea 1219
- `monthTotals(m)` · línea 1220
- `lastMonths(n)` · línea 1227
- `recurring()` · línea 1229

## Análisis: de un vistazo · línea 1241
- `liquidity()` · línea 1243
- `avgMonthlyExpense()` · línea 1245
- `cushion()` · línea 1247
- `pace()` · línea 1249
- `upcoming(days=31)` · línea 1255
- `forecast()` · línea 1265
- `topMerchants(m,n=5)` · línea 1277
- `dailySpend(m)` · línea 1278
- `insights()` · línea 1280

## Fiscalidad (España): FIFO, base del ahorro, borrador · línea 1293
- `cuotaAhorro(base)` · línea 1296
- `matchTransfers(L)` · línea 1298
- `taxGroups()` · línea 1304
- `taxPrefetch(onStep)` · línea 1310
- `taxCompute()` · línea 1319
- `balancesAt(date)` · línea 1360
- `modelo721(year)` · línea 1361
- `taxSummary(year,extra=0)` · línea 1367
- `byCoin(disp)` · línea 1372

## Conexión con el Worker (exchanges, precios, sincronización) · línea 1374
- `api(path,opts={})` · línea 1376
- `syncBalances(manual=false)` · línea 1395

## Sincronización cifrada entre dispositivos · línea 1416
- `b64u(b)` · línea 1419
- `syncKey()` · línea 1421
- `syncId()` · línea 1422
- `syncPayload()` · línea 1424
- `encrypt(obj)` · línea 1425
- `decrypt(s)` · línea 1431
- `mergeStates(local,remote)` · línea 1437
- `scheduleSync(ms=1500)` · línea 1464
- `syncNow(manual=false)` · línea 1465
- `ago(t)` · línea 1501
- `paintSync()` · línea 1502
- `pairLink()` · línea 1511
- `readPair()` · línea 1512

## Avisos · línea 1521
- `alerts()` · línea 1522

## Gráficos interactivos (SVG propios, sin librerías) · línea 1539
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1544
- `svgCompare(m)` · línea 1559
- `svgDays(m)` · línea 1573
- `svgMonths(months)` · línea 1582
- `donut(entries,{id='cats',label='Gastado',total}={})` · línea 1589
- `allocBar(parts,total)` · línea 1595
- `bindCharts(root=document)` · línea 1599

## Instalación PWA, radar y Copiloto · línea 1632
- `installState()` · línea 1637
- `installApp()` · línea 1638
- `repairPWA()` · línea 1643
- `aiPayload(kind)` · línea 1648
- `localAdvice(kind)` · línea 1654
- `portfolioMetricsFromPayload(rows)` · línea 1682
- `runAI(kind)` · línea 1683
- `vCopilot()` · línea 1694
- `calcTechnical(closes)` · línea 1702
- `loadAssetIntel(sym)` · línea 1707
- `loadRadar()` · línea 1713
- `assetIntelHTML(sym)` · línea 1714

## Navegación · línea 1716
- `go(v,f)` · línea 1723
- `navBtn(id,n,i,cls='nav')` · línea 1729
- `navBtns(cls)` · línea 1730
- `sideNav()` · línea 1731
- `drawerNav()` · línea 1732
- `renderNav()` · línea 1733
- `render()` · línea 1742
- `head(title,sub,actions='')` · línea 1752
- `catInitials(c)` · línea 1754
- `initials(s)` · línea 1756
- `assetColor(sym)` · línea 1758
- `moneyBig(eur)` · línea 1760
- `rangeBtns()` · línea 1765
- `deltaPill(chg,base,txt)` · línea 1767

## Inicio · línea 1770
- `accountLine(a,rows)` · línea 1771
- `homeAssets(rows)` · línea 1775
- `changeCell(days,label)` · línea 1779
- `compactEmpty(title,text,action)` · línea 1782
- `vResumenMobile()` · línea 1783
- `greeting()` · línea 1797
- `safeToSpend()` · línea 1799
- `accValue(a,rows)` · línea 1800
- `accCard(a,rows)` · línea 1801
- `vResumen()` · línea 1806
- `catRow(k,v,max,total,attrs)` · línea 1825
- `onboarding()` · línea 1829
- `txItem(t)` · línea 1837
- `goalRow(g)` · línea 1841
- `goalSaved(g)` · línea 1846

## Movimientos (pestaña «Gastos») · línea 1848
- `filtered()` · línea 1849
- `vMovs()` · línea 1854
- `editTx(id)` · línea 1882
- `quickAdd()` · línea 1893

## Objetivos y presupuestos · línea 1908
- `vGoals()` · línea 1909
- `editGoal(id)` · línea 1917

## Inversiones · línea 1927
- `costBasis()` · línea 1928
- `invSeries(days)` · línea 1930
- `portfolioMetrics(list,total)` · línea 1934
- `portfolioScore(pm,coverage)` · línea 1937
- `decisionPanel(pm,coverage,list)` · línea 1942
- `scenarioPanel(total)` · línea 1952
- `exposurePanel(dn,pm)` · línea 1956
- `marketTabs()` · línea 1957
- `positionsPanel(list,ops,ders)` · línea 1958
- `vInv()` · línea 1959
- `holdingRow(x)` · línea 1972
- `riskStrip(pm,list,total)` · línea 1973
- `radarHTML(trends)` · línea 1974
- `invDonut(list,total)` · línea 1978
- `accTable(rows)` · línea 1979
- `opsTable(ops)` · línea 1984
- `tvSymbol(sym)` · línea 1989
- `tradingViewURL(sym)` · línea 1996
- `assetDetail(sym)` · línea 1997
- `editOp(id)` · línea 2009
- `editDeriv(id)` · línea 2021

## Impuestos · línea 2034
- `vTax()` · línea 2036
- `taxCSV(year)` · línea 2060
- `taxAIText(year)` · línea 2069

## Cuentas · línea 2080
- `vCuentas()` · línea 2083
- `editAcc(id)` · línea 2093

## Ajustes · línea 2104
- `vAjustes()` · línea 2106
- `workerInfoHTML(i)` · línea 2125
- `vMas()` · línea 2130

## Ventana, descargas y acciones · línea 2144
- `modal(title,html)` · línea 2145
- `download(name,text,type='application/json')` · línea 2146
- `copyText(t,msg='Copiado')` · línea 2147
- `resetDrawerGesture()` · línea 2151
- `openDrawer()` · línea 2152
- `closeDrawer()` · línea 2153
- `gestureStart(e)` · línea 2155
- `gestureMove(e)` · línea 2163
- `gestureEnd(e)` · línea 2174
- `act(a,el)` · línea 2181
- `confirmTwice(el)` · línea 2274
- `afterRender()` · línea 2313

## Arranque · línea 2331
- `refreshAll(force)` · línea 2333
- `init()` · línea 2339
