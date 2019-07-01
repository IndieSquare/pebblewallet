//
//  browser.h
//  web3
//
//  Created by Chris on 7/2/18.
//  Copyright © 2018 IndieSquare. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

typedef void (^receivedMessage)(NSString *message);
@interface TiApp : NSObject
-(void)showModalController:(UIViewController*)controller animated:(BOOL)animated;
@end
 
@interface browser : UIViewController <WKUIDelegate,WKScriptMessageHandler,WKNavigationDelegate>
-(WKWebView*)getBrowser:(double)width andHeight:(double)height andUrl:(NSString*)url andController:(TiApp*)controller andScript:(NSString*)scriptContent andReceivedMessage:(receivedMessage)receivedMessage andNavigationMessage:(receivedMessage)navigationMessage;

@end
