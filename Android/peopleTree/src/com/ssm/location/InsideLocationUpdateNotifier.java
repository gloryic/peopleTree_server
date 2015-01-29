package com.ssm.location;

class InsideLocationUpdateNotifier implements UpdateNotifier{
	InsideLocationListener parent;
	@Override
	public void notifyUpdate(Object arg) {
		parent = (InsideLocationListener)arg; 
	}

}
